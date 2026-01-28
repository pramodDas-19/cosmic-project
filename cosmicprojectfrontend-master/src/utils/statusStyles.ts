export type ProjectStatus =
  | "Planning"
  | "In Progress"
  | "Completed"
  | "Delayed"
  | "On Hold"
  | string;

export type TaskStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "delayed"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | string;

export type PriorityLevel =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "Low"
  | "Medium"
  | "High"
  | "Urgent"
  | string;

const PROJECT_STATUS_STYLES: Record<string, string> = {
  planning: "bg-blue-500 text-white",
  "in progress": "bg-yellow-500 text-white",
  completed: "bg-green-500 text-white",
  delayed: "bg-red-500 text-white",
  "on hold": "bg-gray-500 text-white",
  // Add more statuses as needed
};

const TASK_STATUS_STYLES: Record<string, string> = {
  assigned: "bg-blue-500 text-white",
  "in progress": "bg-pending text-pending-foreground",
  in_progress: "bg-pending text-pending-foreground",
  completed: "bg-success text-success-foreground",
  delayed: "bg-destructive text-destructive-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-pending text-pending-foreground",
  low: "bg-muted text-muted-foreground",
};

export const getProjectStatusClasses = (status?: ProjectStatus): string => {
  if (!status) return "bg-muted text-muted-foreground";

  const key = String(status).toLowerCase();
  return PROJECT_STATUS_STYLES[key] ?? "bg-muted text-muted-foreground";
};

export const getTaskStatusClasses = (status?: TaskStatus): string => {
  if (!status) return "bg-muted text-muted-foreground";

  const normalized = String(status).toLowerCase().replace("_", " ");
  return (
    TASK_STATUS_STYLES[normalized] ??
    TASK_STATUS_STYLES[String(status)] ??
    "bg-muted text-muted-foreground"
  );
};

export const getPriorityClasses = (priority?: PriorityLevel): string => {
  if (!priority) return "bg-muted text-muted-foreground";

  const key = String(priority).toLowerCase();
  return PRIORITY_STYLES[key] ?? "bg-muted text-muted-foreground";
};
