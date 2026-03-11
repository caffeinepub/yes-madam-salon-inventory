import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  Download,
  Search,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStaff } from "../hooks/useQueries";
import {
  clearAttendanceStatus,
  getAttendanceForDate,
  markAllPresentForDate,
  setAttendanceStatus,
} from "../lib/dataService";
import type { AttendanceStatus } from "../types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function exportAttendanceCSV(
  data: {
    name: string;
    role: string;
    mobile?: string;
    status: AttendanceStatus | undefined;
  }[],
  date: string,
) {
  const header = ["Name", "Role", "Mobile", "Status", "Date"];
  const rows = data.map((d) => [
    d.name,
    d.role,
    d.mobile ?? "",
    d.status ?? "Not Marked",
    date,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Attendance() {
  const [date, setDate] = useState<string>(todayStr);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: staff = [] } = useStaff();

  const { data: attendanceMap = {} } = useQuery<
    Record<number, AttendanceStatus>
  >({
    queryKey: ["attendance", date],
    queryFn: () => getAttendanceForDate(date),
  });

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q),
    );
  }, [staff, search]);

  const presentCount = staff.filter(
    (s) => attendanceMap[s.id] === "present",
  ).length;
  const absentCount = staff.filter(
    (s) => attendanceMap[s.id] === "absent",
  ).length;
  const notMarkedCount = staff.length - presentCount - absentCount;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["attendance"] });
  }

  async function handlePresent(staffId: number) {
    try {
      await setAttendanceStatus(staffId, date, "present");
      invalidate();
      toast.success("Marked as Present");
    } catch {
      toast.error("Failed to mark attendance");
    }
  }

  async function handleAbsent(staffId: number) {
    try {
      await setAttendanceStatus(staffId, date, "absent");
      invalidate();
      toast.success("Marked as Absent");
    } catch {
      toast.error("Failed to mark attendance");
    }
  }

  async function handleClear(staffId: number) {
    try {
      await clearAttendanceStatus(staffId, date);
      invalidate();
      toast("Attendance cleared");
    } catch {
      toast.error("Failed to clear attendance");
    }
  }

  async function handleMarkAll() {
    try {
      await markAllPresentForDate(
        staff.map((s) => s.id),
        date,
      );
      invalidate();
      toast.success("All staff marked as Present");
    } catch {
      toast.error("Failed to mark all present");
    }
  }

  function handleDownload() {
    const rows = staff.map((s) => ({
      name: s.name,
      role: s.role,
      mobile: s.mobile,
      status: attendanceMap[s.id],
    }));
    exportAttendanceCSV(rows, date);
    toast.success("Attendance exported to CSV");
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
          <CalendarCheck size={28} className="text-primary" />
          Attendance
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Mark and track daily staff attendance
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {staff.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-green-200 dark:border-green-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <UserCheck
                  size={16}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {presentCount}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-red-200 dark:border-red-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <UserX size={16} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                  {absentCount}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-amber-200 dark:border-amber-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <UserMinus
                  size={16}
                  className="text-amber-500 dark:text-amber-400"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                  {notMarkedCount}
                </p>
                <p className="text-xs text-muted-foreground">Not Marked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <CalendarCheck size={18} className="text-primary" />
              Daily Attendance
            </CardTitle>

            {/* Date picker */}
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                data-ocid="attendance.date.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-44 text-sm"
              />
              <Button
                data-ocid="attendance.mark_all_button"
                size="sm"
                variant="outline"
                onClick={handleMarkAll}
                className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
              >
                <CheckCircle2 size={14} />
                Mark All Present
              </Button>
              <Button
                data-ocid="attendance.download_button"
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="gap-1.5"
              >
                <Download size={14} />
                Download CSV
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="attendance.search_input"
              className="pl-9 h-9"
              placeholder="Search staff by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div
              data-ocid="attendance.empty_state"
              className="text-center py-16 text-muted-foreground text-sm"
            >
              <Users size={40} className="mx-auto mb-3 opacity-25" />
              <p className="font-medium text-base">No staff found</p>
              <p className="text-xs mt-1 text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Add staff members from the Staff page to track attendance"}
              </p>
            </div>
          ) : (
            <Table data-ocid="attendance.table">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs pl-4">Staff Member</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right pr-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((s, idx) => {
                  const ocidIdx = idx + 1;
                  const status = attendanceMap[s.id] as
                    | AttendanceStatus
                    | undefined;

                  return (
                    <TableRow
                      key={s.id}
                      data-ocid={`attendance.item.${ocidIdx}`}
                      className="hover:bg-muted/30"
                    >
                      {/* Member */}
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {getInitials(s.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">
                              {s.name}
                            </p>
                            {s.mobile && (
                              <p className="text-xs text-muted-foreground">
                                {s.mobile}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-body">
                          {s.role}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {status === "present" ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 hover:bg-green-100 gap-1.5 text-xs font-medium">
                            <CheckCircle2 size={11} />
                            Present
                          </Badge>
                        ) : status === "absent" ? (
                          <Badge className="bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 hover:bg-red-100 gap-1.5 text-xs font-medium">
                            <XCircle size={11} />
                            Absent
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground font-medium"
                          >
                            Not Marked
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            data-ocid={`attendance.present_button.${ocidIdx}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handlePresent(s.id)}
                            className={
                              status === "present"
                                ? "h-7 text-xs px-2.5 bg-green-100 text-green-700 border-green-400 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600"
                                : "h-7 text-xs px-2.5 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                            }
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Present
                          </Button>
                          <Button
                            data-ocid={`attendance.absent_button.${ocidIdx}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbsent(s.id)}
                            className={
                              status === "absent"
                                ? "h-7 text-xs px-2.5 bg-red-100 text-red-600 border-red-400 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600"
                                : "h-7 text-xs px-2.5 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                            }
                          >
                            <XCircle size={12} className="mr-1" />
                            Absent
                          </Button>
                          <Button
                            data-ocid={`attendance.clear_button.${ocidIdx}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleClear(s.id)}
                            disabled={!status}
                            className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
