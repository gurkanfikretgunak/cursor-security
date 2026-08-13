export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type SecurityDomain =
  | "secrets"
  | "client"
  | "backend"
  | "dependencies"
  | "config"
  | "project";

export interface Finding {
  id: string;
  domain: SecurityDomain;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

export interface DomainResult {
  domain: SecurityDomain;
  label: string;
  findings: Finding[];
  score: number;
  passed: number;
  failed: number;
}

export interface SecurityReport {
  projectPath: string;
  scannedAt: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  domains: DomainResult[];
  findings: Finding[];
  services: ServiceStatus[];
}

export interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: "ready" | "degraded" | "unavailable";
  checks: number;
}
