import { Box, Stack, Typography } from "@mui/material";

export default function SectionSubHeader({ icon, bg, title, description }) {
    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {
                icon ? (<>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </Box>
                </>) : (null)
            }
            <Box>
                <Typography variant="h6" fontWeight={600}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </Box>
        </Stack>
    );
}