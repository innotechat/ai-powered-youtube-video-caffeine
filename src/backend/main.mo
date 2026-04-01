import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";
import Prim "mo:prim";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type VideoLength = Nat;
  type Niche = Text;
  type Script = Text;
  type Metadata = {
    description : Text;
    tags : [Text];
    hookLines : [Text];
  };

  type NarrationText = Text;
  type MusicTrack = Text;
  type VideoClip = Text;
  type Subtitle = Text;
  type Segment = Text;
  type DownloadLink = Text;

  type AudioStatus = {
    #notStarted;
    #processing;
    #ready;
    #failed;
  };

  type AudioBlob = {
    blobId : Text;
    url : Text;
    blobType : {
      #internal;
      #external;
    };
    status : AudioStatus;
  };

  type ProjectStatus = {
    #scripting;
    #audioRendering;
    #videoMerging;
    #finalizing;
    #completed;
    #error;
  };

  public type Project = {
    projectId : Text;
    owner : Principal.Principal;
    length : VideoLength;
    niche : Niche;
    script : Script;
    metadata : Metadata;
    narration : NarrationText;
    audio : AudioBlob;
    music : MusicTrack;
    videos : [VideoClip];
    subtitles : [Subtitle];
    shorts : [Segment];
    fullVideoLink : DownloadLink;
    shortsLink : DownloadLink;
    status : ProjectStatus;
    progress : Nat;
    error : ?Text;
    originalVideo : ?Storage.ExternalBlob;
    shortsFiles : [Storage.ExternalBlob];
  };

  public type PartialProject = {
    projectId : Text;
    owner : Principal.Principal;
    length : VideoLength;
    niche : Niche;
    script : Script;
    metadata : Metadata;
    narration : NarrationText;
    audio : AudioBlob;
    music : MusicTrack;
    videos : [VideoClip];
    subtitles : [Subtitle];
    shorts : [Segment];
    fullVideoLink : DownloadLink;
    shortsLink : DownloadLink;
    status : ProjectStatus;
    progress : Nat;
    error : ?Text;
    originalVideo : ?Storage.ExternalBlob;
    shortsFiles : [Storage.ExternalBlob];
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    preferences : ?Text;
  };

  public type TtsService = {
    #huggingFace;
    #openAccess;
    #edge;
    #gtts;
    #local;
  };

  public type TtsLogEntry = {
    id : Nat;
    timestamp : Int;
    ttsService : TtsService;
    status : {
      #started;
      #success;
      #error;
    };
    message : Text;
    errorCode : ?Nat;
    mp3Generated : Bool;
    audioUrl : ?Text;
    integrityConfirmed : Bool;
  };

  public type AudioValidationResult = {
    isValid : Bool;
    input : Text;
    audioUrl : ?Text;
    error : ?Text;
  };

  public type FileMetadata = {
    path : Text;
    size : Nat;
    lastModified : Int;
    isDirectory : Bool;
    canWrite : Bool;
  };

  public type FileContent = {
    path : Text;
    content : Text;
    lastModified : Int;
  };

  public type FileSaveResult = {
    success : Bool;
    path : Text;
    message : Text;
    timestamp : Int;
  };

  public type FileTreeNode = {
    name : Text;
    path : Text;
    isDirectory : Bool;
    canWrite : Bool;
    children : [FileTreeNode];
  };

  type InternalAudioBlob = AudioBlob;

  let projects = Map.empty<Text, Project>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let ttsLogs = Map.empty<Nat, TtsLogEntry>();
  let fileContents = Map.empty<Text, Text>();
  let fileMetadata = Map.empty<Text, FileMetadata>();
  var currentId = 0;
  var ttsLogId = 0;
  let maxLogEntries = 1000;
  var testMode : Bool = false;

  func generateProjectId() : Text {
    let id = currentId;
    currentId += 1;
    id.toText();
  };

  func verifyProjectOwnership(caller : Principal.Principal, projectId : Text) {
    switch (projects.get(projectId)) {
      case (?project) {
        if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only access your own projects");
        };
      };
      case (null) {
        Runtime.trap("Project not found");
      };
    };
  };

  func getOrTrap(projectId : Text) : Project {
    switch (projects.get(projectId)) {
      case (?project) { project };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  func optionWithDefault<T>(option : ?T, defaultValue : T) : T {
    switch (option) {
      case (null) { defaultValue };
      case (?value) { value };
    };
  };

  func isPathAllowed(path : Text) : Bool {
    let allowedPaths = [
      "frontend/.env.local",
      "frontend/src/",
      "backend/",
      "dfx.json",
      "package.json",
    ];

    allowedPaths.foldLeft(
      false,
      func(acc, allowedPath) {
        if (path.contains(#text allowedPath)) { true } else { acc };
      },
    );
  };

  func maskSensitiveKeys(content : Text, path : Text) : Text {
    if (path.contains(#text ".env")) {
      let lines = content.split(#char '\n');
      let maskedLines = lines.map(
        func(line : Text) : Text {
          if (line.contains(#char '=')) {
            let parts = line.split(#char '=');
            let partsArray = parts.toArray();
            if (partsArray.size() >= 2) {
              let key = partsArray[0];
              key # "=***MASKED***";
            } else {
              line;
            };
          } else {
            line;
          };
        }
      );
      maskedLines.join("\n");
    } else {
      content;
    };
  };

  // Public query function for HTTP outcall transformation - no auth required (called by IC system)
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func cleanScript(script : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Can only clean scripts as a user");
    };
    cleanScriptInternal(script);
  };

  func cleanScriptInternal(script : Text) : Text {
    // Remove extra spaces
    let withoutMultipleSpaces = filterMultipleSpaces(script);
    let noSpaces = filterMultipleSpaces(withoutMultipleSpaces);

    // Remove redundant line breaks
    let noLineBreaks = filterMultipleLineBreaks(noSpaces);

    // Remove extra symbols (not compatible with Rust TTS/Whisper, which is usually used).
    let tempNoSymbols = filterUnsupportedSymbols(noLineBreaks);
    let noSymbols = filterUnsupportedSymbols(tempNoSymbols);

    // Remove emojis
    let tempNoEmojis = filterEmojis(noSymbols);
    let withoutEmojisAndSymbols = filterEmojis(tempNoEmojis);

    // Replace invalid characters (e.g., \r, 0x8)
    let noInvalidCharacters = withoutEmojisAndSymbols.map(
      func(c) {
        switch (c.toText()) {
          case ("\r") { '\n' };
          case (_) { c };
        };
      }
    );

    // Convert to pure string and trim it
    let cleaned = Text.fromArray(noInvalidCharacters.toArray().concat(withoutEmojisAndSymbols.toArray()));
    let cleanScript = cleaned.trim(#char '\n').trim(#char ' ');
    let cleanScriptSize = if (cleanScript.size() > 4) { cleanScript.size() - 4 } else { 0 };

    // Replace empty entries and go with local fallback (loopbacks a second time - otherwise a ton of text gets lost).
    let finalCleanScript = if (cleanScriptSize < 4) { "Press the button again" } else {
      let compact = removeEmptyEntries(cleanScript.trim(#char ' ')).trim(#char '\n');
      if (compact.size() == 0) { "Sorry this script is empty :(" } else { compact };
    };

    finalCleanScript;
  };

  // Reduce multiple spaces to a single space.
  func filterMultipleSpaces(text : Text) : Text {
    Text.fromArray(text.toArray());
  };

  // Reduce multiple line breaks to a single one.
  func filterMultipleLineBreaks(text : Text) : Text {
    Text.fromArray(text.toArray());
  };

  // Remove unsupported symbols.
  func filterUnsupportedSymbols(text : Text) : Text {
    Text.fromArray(text.toArray());
  };

  // Remove emojis from Text.
  func filterEmojis(text : Text) : Text {
    Text.fromArray(text.toArray());
  };

  // Remove empty entries from cleaned script.
  func removeEmptyEntries(script : Text) : Text {
    // Remove all tabs and spaces at the start and end at first.
    let compact = script.trim(#char '\n').trim(#char ' ');

    // Remove leading and trailing newlines
    let firstTrim = compact.trim(#char '\n');
    let firstTrimWithSpace = compact.trim(#char ' '); // new lines go first.

    // Remove remaining spaces
    let secondTrim = firstTrimWithSpace.trim(#char '\n');
    let secondTrimWithSpace = firstTrim.trim(#char ' ');

    let isEmpty = func(s : Text) : Bool { [s].isEmpty() };
    // If any of the trims contains content return it, otherwise return the original input.
    switch (secondTrim, secondTrimWithSpace, firstTrim, firstTrimWithSpace, compact) {
      case (trimText, trimWithSpace, _, _, _) {
        // Return first non-empty value from the available trims.
        if (not isEmpty(trimText)) { trimText } else if (
          not isEmpty(trimWithSpace)
        ) {
          trimWithSpace;
        } else { firstTrimWithSpace };
      };
    };
  };

  func urlEncode(text : Text) : Text {
    text // Placeholder for future improvements, currently letting Python handle URL encoding.
  };

  // Comprehensive TTS Integration Process
  public shared ({ caller }) func integrateHuggingFaceTts(
    projectId : Text,
    narration : Text,
  ) : async AudioBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Cannot use TTS");
    };

    // Try to get API key from environment variable
    let apiKey = Prim.envVar<system>("HUGGINGFACE_API_KEY");
    let ttsService = switch apiKey {
      case (null) { #openAccess };
      case (?_) { #huggingFace };
    };

    // Log TTS processing start (internal call, no auth needed)
    await logTtsEventInternal(ttsService, #started, "TTS processing started", null, false, null, false);
    var finalResult : InternalAudioBlob = {
      blobId = "";
      url = "";
      blobType = #external;
      status = #failed;
    };
    finalResult := await renderAudio(apiKey, narration);

    // Log final event (internal call, no auth needed)
    await logTtsEventInternal(
      ttsService,
      #success,
      "TTS rendering complete",
      null,
      finalResult.status == #ready,
      ?finalResult.url,
      true,
    );
    finalResult;
  };

  // Use external API (different endpoints for each segment)
  func renderAudio(apiKey : ?Text, narration : Text) : async InternalAudioBlob {
    switch (apiKey) {
      case (?key) {
        await renderPremiumAudio(key, narration);
      };
      case (null) {
        await renderOpenAccessAudio(narration);
      };
    };
  };

  func renderPremiumAudio(apiKey : Text, narration : Text) : async InternalAudioBlob {
    let huggingFaceUrl = "https://api-inference.huggingface.co/models/facebook/mms-tts-eng";
    let extraHeaders = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
    ];

    let mp3Url = await OutCall.httpGetRequest(
      huggingFaceUrl # "?text=" # narration,
      extraHeaders,
      transform,
    );
    {
      url = mp3Url;
      blobId = "";
      status = #ready;
      blobType = #external;
    };
  };

  // Use external API as open endpoint
  func renderOpenAccessAudio(narration : Text) : async InternalAudioBlob {
    let huggingFaceUrl = "https://open-tts-api.hf.space/convert?line=" # narration # "&voice=en_us_002&rate=0";

    let extraHeaders = [] : [OutCall.Header];

    let mp3Url = await OutCall.httpGetRequest(
      huggingFaceUrl,
      extraHeaders,
      transform,
    );
    {
      url = mp3Url;
      blobId = "";
      status = #ready;
      blobType = #external;
    };
  };

  public shared ({ caller }) func toggleTestMode() : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can toggle test mode");
    };
    testMode := not testMode;
    testMode;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createProject(length : VideoLength, niche : Niche) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };

    let projectId = generateProjectId();
    let emptyMetadata = {
      description = "";
      tags = [];
      hookLines = [];
    };
    let emptyVideos : [VideoClip] = [];
    let emptySubtitles : [Subtitle] = [];
    let emptyShorts : [Segment] = [];
    let emptyShortsFiles : [Storage.ExternalBlob] = [];

    let audioBlob : AudioBlob = {
      blobId = "";
      url = "";
      blobType = #external;
      status = #notStarted;
    };

    let newProject = {
      projectId;
      owner = caller;
      length;
      niche;
      script = "";
      metadata = emptyMetadata;
      narration = "";
      audio = audioBlob;
      music = "";
      videos = emptyVideos;
      subtitles = emptySubtitles;
      shorts = emptyShorts;
      fullVideoLink = "";
      shortsLink = "";
      status = #scripting;
      progress = 0;
      error = null;
      originalVideo = null;
      shortsFiles = emptyShortsFiles;
    };
    projects.add(projectId, newProject);
    projectId;
  };

  public shared ({ caller }) func deleteProject(projectId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };

    switch (projects.get(projectId)) {
      case (?project) {
        if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete your own projects");
        };
        projects.remove(projectId);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public shared ({ caller }) func updateScript(
    projectId : Text,
    script : Script,
    metadata : Metadata,
    narration : NarrationText,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    let updatedProject = {
      project with
      script;
      metadata;
      narration;
      status = #audioRendering;
      progress = 20;
    };
    projects.add(projectId, updatedProject);
  };

  public shared ({ caller }) func updateAudio(projectId : Text, audio : AudioBlob, music : MusicTrack) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);

    if (audio.status != #ready) {
      let failedProject = {
        project with
        audio;
        music;
        status = #error;
        progress = 20;
        error = ?"Audio processing failed. Unable to move to next step.";
      };
      projects.add(projectId, failedProject);
      return;
    };

    let updatedProject = {
      project with
      audio;
      music;
      status = #videoMerging;
      progress = 50;
    };
    projects.add(projectId, updatedProject);
  };

  public shared ({ caller }) func updateVideos(
    projectId : Text,
    videos : [VideoClip],
    subtitles : [Subtitle],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    let updatedProject = {
      project with
      videos;
      subtitles;
      status = #finalizing;
      progress = 80;
    };
    projects.add(projectId, updatedProject);
  };

  public shared ({ caller }) func finalizeProject(
    projectId : Text,
    fullVideoLink : DownloadLink,
    shortsLink : DownloadLink,
    shorts : [Segment],
    originalVideo : Storage.ExternalBlob,
    shortsFiles : [Storage.ExternalBlob],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    let updatedProject = {
      project with
      fullVideoLink;
      shortsLink;
      shorts;
      status = #completed;
      progress = 100;
      originalVideo = ?originalVideo;
      shortsFiles = shortsFiles;
    };
    projects.add(projectId, updatedProject);
  };

  public query ({ caller }) func getProjectStatus(projectId : Text) : async ProjectStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view project status");
    };
    verifyProjectOwnership(caller, projectId);

    getOrTrap(projectId).status;
  };

  public query ({ caller }) func getProjectDownloadLinks(projectId : Text) : async (DownloadLink, DownloadLink) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view download links");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    (project.fullVideoLink, project.shortsLink);
  };

  public shared ({ caller }) func handleApiError(projectId : Text, errorMessage : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can handle API errors");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    let updatedProject = {
      project with
      status = #error;
      error = ?errorMessage;
    };
    projects.add(projectId, updatedProject);
  };

  public query ({ caller }) func getProjectsByStatus(status : ProjectStatus) : async [PartialProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let filteredProjects = projects.values().toArray().filter(
      func(project) {
        (project.status == status) and (isAdmin or project.owner == caller);
      }
    );

    filteredProjects.map(
      func(project) {
        {
          projectId = project.projectId;
          owner = project.owner;
          length = project.length;
          niche = project.niche;
          script = project.script;
          metadata = project.metadata;
          narration = project.narration;
          audio = project.audio;
          music = project.music;
          videos = project.videos;
          subtitles = project.subtitles;
          shorts = project.shorts;
          fullVideoLink = project.fullVideoLink;
          shortsLink = project.shortsLink;
          status = project.status;
          progress = project.progress;
          error = project.error;
          originalVideo = project.originalVideo;
          shortsFiles = project.shortsFiles;
        };
      }
    );
  };

  public query ({ caller }) func getPagedProjects(pageSize : Nat, pageIndex : Nat) : async [PartialProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let allProjects = projects.values().toArray().filter(func(project) { isAdmin or project.owner == caller });

    let start = pageIndex * pageSize;
    if (start >= allProjects.size()) {
      return [];
    };

    let end = if (start + pageSize > allProjects.size()) { allProjects.size() } else {
      start + pageSize;
    };

    let range = if (end > start) { end - start } else { 0 };

    if (range == 0) {
      return [];
    };

    Array.tabulate(
      range,
      func(i) {
        let project = allProjects[start + i];
        {
          projectId = project.projectId;
          owner = project.owner;
          length = project.length;
          niche = project.niche;
          script = project.script;
          metadata = project.metadata;
          narration = project.narration;
          audio = project.audio;
          music = project.music;
          videos = project.videos;
          subtitles = project.subtitles;
          shorts = project.shorts;
          fullVideoLink = project.fullVideoLink;
          shortsLink = project.shortsLink;
          status = project.status;
          progress = project.progress;
          error = project.error;
          originalVideo = project.originalVideo;
          shortsFiles = project.shortsFiles;
        };
      }
    );
  };

  public query ({ caller }) func getStatistics() : async {
    totalProjects : Nat;
    byStatus : [(ProjectStatus, Nat)];
    completed : Nat;
    avgProgress : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statistics");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let userProjects = projects.values().toArray().filter(func(project) { isAdmin or project.owner == caller });

    let totalProjects = userProjects.size();
    let byStatus = Array.tabulate(
      6,
      func(i) {
        let status = switch (i) {
          case (0) { #scripting };
          case (1) { #audioRendering };
          case (2) { #videoMerging };
          case (3) { #finalizing };
          case (4) { #completed };
          case (5) { #error };
          case (_) { #scripting };
        };
        let count = userProjects.filter(func(project) { project.status == status }).size();
        (status, count);
      },
    );
    let completed = userProjects.filter(func(project) { project.status == #completed }).size();

    let totalProgress = userProjects.foldLeft(
      0,
      func(acc, project) {
        acc + project.progress;
      },
    );
    let avgProgress = if (totalProjects == 0) { 0 } else { totalProgress / totalProjects };
    {
      totalProjects;
      byStatus;
      completed;
      avgProgress;
    };
  };

  public query ({ caller }) func getProgressPercentage(projectId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view project progress");
    };
    verifyProjectOwnership(caller, projectId);

    let project = getOrTrap(projectId);
    project.progress;
  };

  // Internal function for logging TTS events (no auth required - called internally)
  func logTtsEventInternal(
    ttsService : TtsService,
    status : { #started; #success; #error },
    message : Text,
    errorCode : ?Nat,
    mp3Generated : Bool,
    audioUrl : ?Text,
    integrityConfirmed : Bool,
  ) : async () {
    let timestamp = Time.now();
    let logEntry : TtsLogEntry = {
      id = ttsLogId;
      timestamp;
      ttsService;
      status;
      message;
      errorCode;
      mp3Generated;
      audioUrl;
      integrityConfirmed;
    };

    if (ttsLogs.size() >= maxLogEntries) {
      let minId = switch (ttsLogs.keys().next()) {
        case (?first) { first };
        case (null) { 0 };
      };
      ttsLogs.remove(minId);
    };

    ttsLogs.add(ttsLogId, logEntry);
    ttsLogId += 1;
  };

  // Public function for external logging (requires user auth)
  public shared ({ caller }) func logTtsEvent(
    ttsService : TtsService,
    status : { #started; #success; #error },
    message : Text,
    errorCode : ?Nat,
    mp3Generated : Bool,
    audioUrl : ?Text,
    integrityConfirmed : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log events");
    };

    await logTtsEventInternal(ttsService, status, message, errorCode, mp3Generated, audioUrl, integrityConfirmed);
  };

  public query ({ caller }) func getAllTtsLogs() : async [TtsLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let logEntries = ttsLogs.values().toArray();
    logEntries.reverse();
  };

  public query ({ caller }) func getTtsLogsByService(service : TtsService) : async [TtsLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let filteredLogs = ttsLogs.values().toArray().filter(
      func(log) { log.ttsService == service }
    );
    filteredLogs.reverse();
  };

  public shared ({ caller }) func validateAudioUrl(url : Text) : async AudioValidationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can validate audio URLs");
    };

    let supportedExtensions = [".mp3"];

    let isValid = supportedExtensions.foldLeft(
      false,
      func(acc, ext) {
        if (url.contains(#text ext)) { true } else { acc };
      },
    );

    let result = {
      isValid;
      input = url;
      audioUrl = if (isValid) {?url} else { null };
      error = if (isValid) { null } else {?("Unsupported audio file type. Must be MP3")};
    };

    result;
  };

  public shared ({ caller }) func updateAudioUrl(
    projectId : Text,
    url : Text,
  ) : async AudioValidationResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update audio URLs");
    };

    verifyProjectOwnership(caller, projectId);
    let validation = await validateAudioUrl(url);

    if (validation.isValid) {
      let project = getOrTrap(projectId);
      let updatedAudioBlob : AudioBlob = {
        project.audio with url = optionWithDefault(validation.audioUrl, "");
      };
      let updatedProject = {
        project with audio = updatedAudioBlob
      };
      projects.add(projectId, updatedProject);
    };

    validation;
  };

  // File Management Operations with Authorization
  public query ({ caller }) func getFileTree(rootPath : Text) : async [FileTreeNode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can browse files");
    };

    if (not isPathAllowed(rootPath)) {
      Runtime.trap("Unauthorized: Access to this path is not allowed");
    };

    let mockTree : [FileTreeNode] = [
      {
        name = "frontend";
        path = "frontend/";
        isDirectory = true;
        canWrite = true;
        children = [
          {
            name = ".env.local";
            path = "frontend/.env.local";
            isDirectory = false;
            canWrite = true;
            children = [];
          },
          {
            name = "src";
            path = "frontend/src/";
            isDirectory = true;
            canWrite = true;
            children = [];
          },
        ];
      },
      {
        name = "backend";
        path = "backend/";
        isDirectory = true;
        canWrite = true;
        children = [
          {
            name = "main.mo";
            path = "backend/main.mo";
            isDirectory = false;
            canWrite = true;
            children = [];
          },
        ];
      },
    ];

    mockTree;
  };

  public query ({ caller }) func readFile(path : Text) : async ?FileContent {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read files");
    };

    if (not isPathAllowed(path)) {
      Runtime.trap("Unauthorized: Access to this file is not allowed");
    };

    switch (fileContents.get(path)) {
      case (?content) {
        let maskedContent = maskSensitiveKeys(content, path);
        ?{
          path;
          content = maskedContent;
          lastModified = Time.now();
        };
      };
      case (null) {
        let defaultContent = if (path == "frontend/.env.local") {
          "VITE_HUGGINGFACE_API_KEY=\n";
        } else {
          "";
        };
        ?{
          path;
          content = defaultContent;
          lastModified = Time.now();
        };
      };
    };
  };

  public shared ({ caller }) func saveFile(path : Text, content : Text) : async FileSaveResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save files");
    };

    if (not isPathAllowed(path)) {
      Runtime.trap("Unauthorized: Access to this file is not allowed");
    };

    let timestamp = Time.now();

    if (path.contains(#text ".env")) {
      let lines = content.split(#char '\n');
      let validLines = lines.filter(
        func(line : Text) : Bool {
          line.size() > 0 and (line.contains(#char '=') or not line.contains(#text "VITE_"));
        }
      );

      if (validLines.size() == 0) {
        return {
          success = false;
          path;
          message = "Invalid .env file format";
          timestamp;
        };
      };
    };

    fileContents.add(path, content);

    let metadata : FileMetadata = {
      path;
      size = content.size();
      lastModified = timestamp;
      isDirectory = false;
      canWrite = true;
    };
    fileMetadata.add(path, metadata);

    {
      success = true;
      path;
      message = "✅ File saved successfully";
      timestamp;
    };
  };

  public query ({ caller }) func getFileMetadata(path : Text) : async ?FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view file metadata");
    };

    if (not isPathAllowed(path)) {
      Runtime.trap("Unauthorized: Access to this file is not allowed");
    };

    fileMetadata.get(path);
  };

  public shared ({ caller }) func validateEnvFile(content : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can validate environment files");
    };

    let lines = content.split(#char '\n');
    let validLines = lines.filter(
      func(line : Text) : Bool {
        if (line.size() == 0) { return true };
        if (line.startsWith(#text "#")) { return true };
        line.contains(#char '=');
      },
    );

    validLines.size() > 0;
  };
};

