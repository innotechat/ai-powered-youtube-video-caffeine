import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface FileContent {
    content: string;
    path: string;
    lastModified: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface AudioValidationResult {
    audioUrl?: string;
    error?: string;
    input: string;
    isValid: boolean;
}
export interface FileSaveResult {
    path: string;
    message: string;
    timestamp: bigint;
    success: boolean;
}
export interface AudioBlob {
    url: string;
    status: AudioStatus;
    blobType: Variant_internal_external;
    blobId: string;
}
export type NarrationText = string;
export interface TtsLogEntry {
    id: bigint;
    status: Variant_started_error_success;
    ttsService: TtsService;
    audioUrl?: string;
    errorCode?: bigint;
    message: string;
    timestamp: bigint;
    mp3Generated: boolean;
    integrityConfirmed: boolean;
}
export interface PartialProject {
    status: ProjectStatus;
    music: MusicTrack;
    shorts: Array<Segment>;
    audio: AudioBlob;
    shortsLink: DownloadLink;
    owner: Principal;
    metadata: Metadata;
    script: Script;
    shortsFiles: Array<ExternalBlob>;
    fullVideoLink: DownloadLink;
    error?: string;
    progress: bigint;
    narration: NarrationText;
    originalVideo?: ExternalBlob;
    projectId: string;
    niche: Niche;
    length: VideoLength;
    videos: Array<VideoClip>;
    subtitles: Array<Subtitle>;
}
export type Niche = string;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type Script = string;
export type VideoLength = bigint;
export type MusicTrack = string;
export type Segment = string;
export interface FileMetadata {
    canWrite: boolean;
    path: string;
    size: bigint;
    lastModified: bigint;
    isDirectory: boolean;
}
export type VideoClip = string;
export type Principal = Principal;
export interface FileTreeNode {
    canWrite: boolean;
    name: string;
    path: string;
    children: Array<FileTreeNode>;
    isDirectory: boolean;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Metadata {
    tags: Array<string>;
    hookLines: Array<string>;
    description: string;
}
export type DownloadLink = string;
export type Subtitle = string;
export interface UserProfile {
    name: string;
    email?: string;
    preferences?: string;
}
export enum AudioStatus {
    notStarted = "notStarted",
    processing = "processing",
    ready = "ready",
    failed = "failed"
}
export enum ProjectStatus {
    videoMerging = "videoMerging",
    scripting = "scripting",
    completed = "completed",
    finalizing = "finalizing",
    error = "error",
    audioRendering = "audioRendering"
}
export enum TtsService {
    edge = "edge",
    gtts = "gtts",
    openAccess = "openAccess",
    local = "local",
    huggingFace = "huggingFace"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_internal_external {
    internal = "internal",
    external = "external"
}
export enum Variant_started_error_success {
    started = "started",
    error = "error",
    success = "success"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cleanScript(script: string): Promise<string>;
    createProject(length: VideoLength, niche: Niche): Promise<string>;
    deleteProject(projectId: string): Promise<boolean>;
    finalizeProject(projectId: string, fullVideoLink: DownloadLink, shortsLink: DownloadLink, shorts: Array<Segment>, originalVideo: ExternalBlob, shortsFiles: Array<ExternalBlob>): Promise<void>;
    getAllTtsLogs(): Promise<Array<TtsLogEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileMetadata(path: string): Promise<FileMetadata | null>;
    getFileTree(rootPath: string): Promise<Array<FileTreeNode>>;
    getPagedProjects(pageSize: bigint, pageIndex: bigint): Promise<Array<PartialProject>>;
    getProgressPercentage(projectId: string): Promise<bigint>;
    getProjectDownloadLinks(projectId: string): Promise<[DownloadLink, DownloadLink]>;
    getProjectStatus(projectId: string): Promise<ProjectStatus>;
    getProjectsByStatus(status: ProjectStatus): Promise<Array<PartialProject>>;
    getStatistics(): Promise<{
        completed: bigint;
        totalProjects: bigint;
        avgProgress: bigint;
        byStatus: Array<[ProjectStatus, bigint]>;
    }>;
    getTtsLogsByService(service: TtsService): Promise<Array<TtsLogEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    handleApiError(projectId: string, errorMessage: string): Promise<void>;
    integrateHuggingFaceTts(projectId: string, narration: string): Promise<AudioBlob>;
    isCallerAdmin(): Promise<boolean>;
    logTtsEvent(ttsService: TtsService, status: Variant_started_error_success, message: string, errorCode: bigint | null, mp3Generated: boolean, audioUrl: string | null, integrityConfirmed: boolean): Promise<void>;
    readFile(path: string): Promise<FileContent | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFile(path: string, content: string): Promise<FileSaveResult>;
    toggleTestMode(): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAudio(projectId: string, audio: AudioBlob, music: MusicTrack): Promise<void>;
    updateAudioUrl(projectId: string, url: string): Promise<AudioValidationResult>;
    updateScript(projectId: string, script: Script, metadata: Metadata, narration: NarrationText): Promise<void>;
    updateVideos(projectId: string, videos: Array<VideoClip>, subtitles: Array<Subtitle>): Promise<void>;
    validateAudioUrl(url: string): Promise<AudioValidationResult>;
    validateEnvFile(content: string): Promise<boolean>;
}
