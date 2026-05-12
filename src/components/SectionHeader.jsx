import { Divider, Typography } from "@mui/material";

export default function SectionHeader({ title }) {
    return (
        <>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {title}
            </Typography>

            <Divider sx={{ my: 3 }} />
        </>
    )
}