import React, { useEffect, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { API_BASE_URL, FILE_BASE_URL } from "@/config/environment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  ClipboardList,
  CheckCircle,
  BarChart3,
} from "lucide-react";

const SuperAdminReports = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedReportTaskId, setSelectedReportTaskId] = useState<string | null>(null);
  const [isDownloadingTaskPdf, setIsDownloadingTaskPdf] = useState(false);

  const generateReport = async (type: string, format: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to generate reports.");
      return;
    }

    setIsGeneratingReport(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, format }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const extension = format === "excel" ? "xlsx" : "pdf";
      link.href = url;
      link.setAttribute(
        "download",
        `${type.replace(/\s+/g, "_")}_report.${extension}`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setUserProfile(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch all projects and flatten tasks (UNCHANGED)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE_URL}/superadmin/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const projects = Array.isArray(data.data.projects)
            ? data.data.projects
            : [];
          const tasks = projects.flatMap((project) =>
            (project.tasks || []).map((task) => ({
              ...task,
              projectName: project.siteName,
            }))
          );
          setAllTasks(tasks);
        }
      });
  }, []);

  return (
    <DashboardLayout
      userRole="super-admin"
      userName={userProfile?.name || "System Administrator"}
      userEmail={userProfile?.email || "admin@cosmicsolutions.com"}
      userProfilePicture={
        userProfile?.profilePicture
          ? `${FILE_BASE_URL}/${userProfile.profilePicture}`
          : undefined
      }
    >
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive reports and analyze system performance.
          </p>
        </div>

        {/* Project Summary Report Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              Project Summary Report
            </CardTitle>
            <CardDescription>
              Comprehensive overview of all projects, their status, and progress.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Key Metrics:</Label>
                <ul className="mt-2 space-y-1">
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    Total Projects
                  </li>
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    Completion Rate
                  </li>
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    Average Duration
                  </li>
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    Budget Analysis
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                {/* PDF */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReport("Project Summary", "pdf")}
                  disabled={isGeneratingReport}
                  className="flex-1"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </>
                  )}
                </Button>

                {/* Excel */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReport("Project Summary", "excel")}
                  disabled={isGeneratingReport}
                  className="flex-1"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminReports;
