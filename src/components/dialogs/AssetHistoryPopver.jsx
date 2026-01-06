import * as React from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";

export default function AssetHistoryPopover({
  open,
  anchorEl,
  onClose,
  assetId, // {assetId, empName, empId, assetStatus}
  onOpenHistory,
}) {
  return (
    <Popover
      open={!!open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "center", horizontal: "center" }}
      transformOrigin={{ vertical: "center", horizontal: "center" }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          px: 2,
          py: 1.25,
          boxShadow: "0px 6px 20px rgba(0,0,0,0.18)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <ButtonBase
          onClick={() => onOpenHistory?.(assetId)}
          sx={{
            px: 1.25,
            py: 0.75,
            borderRadius: 2,
            backgroundColor: "background.paper",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 500, fontSize: 18, lineHeight: 1.2 }}
          >
            변동 이력 조회 ({assetId})
          </Typography>
        </ButtonBase>
      </Box>
    </Popover>
  );
}
