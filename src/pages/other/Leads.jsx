import { useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import { fetchAdminLeads } from "@/lib/api/leadApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";

const Leads = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");

  const loadLeads = useCallback(async () => {
    if (!authToken) return;
    const result = await fetchAdminLeads(authToken, {
      limit: 50,
      search: search.trim(),
    });
    setLeads(result.items);
  }, [authToken, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLeads().catch((error) => toast.error(error.message || "Failed to load leads."));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadLeads, toast]);

  return (
    <Box>
      <SectionHeader title="Leads" />
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography fontWeight={700}>Collected Leads</Typography>
              <Typography color="text.secondary" variant="body2">
                Leads from popup campaigns and future newsletter sources.
              </Typography>
            </Box>
            <TextField
              label="Search email"
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell><Chip label={lead.source || "unknown"} size="small" /></TableCell>
                    <TableCell>{lead.campaignTitle || lead.campaignId || "-"}</TableCell>
                    <TableCell>{lead.pageUrl || "-"}</TableCell>
                    <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</TableCell>
                  </TableRow>
                ))}
                {!leads.length ? (
                  <TableRow>
                    <TableCell colSpan={5}>No leads found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Leads;
