export interface RunnerResult<T>{
    siteId: string;
    status: "success" | "error";
    data: T[];
    error?: string;
}