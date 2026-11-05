export type ComplianceStandard = 
  | 'CIS_LEVEL_1'
  | 'CIS_LEVEL_2'
  | 'NIST_SP_800_53'
  | 'ISO_27001'
  | 'PCI_DSS';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';

export type ComplianceSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ComplianceCategory = 
  | 'SSH Hardening'
  | 'Access Control'
  | 'Network Services'
  | 'Logging & Auditing'
  | 'Authentication & Passwords'
  | 'Routing & Firewalls'
  | 'System Integrity';

export interface ComplianceRule {
  id: string; // e.g. "CIS-5.2.1"
  standard: ComplianceStandard;
  benchmarkName: string; // e.g. "CIS Debian Linux 12 Benchmark v1.0.0"
  title: string;
  category: ComplianceCategory;
  parameter: string; // e.g. "PermitRootLogin"
  currentValue: string; // Observed setting
  expectedValue: string; // Recommended setting
  status: ComplianceStatus;
  severity: ComplianceSeverity;
  rationale: string;
  auditCommand?: string;
  remediationCommand?: string;
  cisSection?: string;
  impactDescription?: string;
}

export interface DeviceComplianceSummary {
  complianceScore: number; // 0 - 100%
  totalRules: number;
  compliantCount: number;
  nonCompliantCount: number;
  warningCount: number;
  notApplicableCount: number;
  criticalFails: number;
  highFails: number;
  mediumFails: number;
  lastAuditDate: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  rules: ComplianceRule[];

  // Standard & benchmark metadata aliases
  benchmarkName?: string;
  standard?: ComplianceStandard;
  totalChecks?: number;
  passedChecks?: number;
  failedChecks?: number;
  warningChecks?: number;
  criticalGaps?: number;
  highGaps?: number;
  lastAudited?: string;
}

export interface FleetComplianceOverview {
  fleetComplianceScore: number; // Overall %
  totalDevicesAudited: number;
  totalChecksEvaluated: number;
  totalPassed: number;
  totalFailed: number;
  totalWarnings: number;
  criticalGaps: number;
  highGaps: number;
  devicesByGrade: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  topNonCompliantParameters: {
    parameter: string;
    affectedCount: number;
    severity: ComplianceSeverity;
    category: ComplianceCategory;
  }[];
  timestamp: string;
}
