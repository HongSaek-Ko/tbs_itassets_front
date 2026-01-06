import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import RegistEntryDialog from "./RegistEntryDialog";
import RegistFormDialog from "./RegistFormDialog";

const makeEmptyRow = () => ({
  assetType: "",
  assetId: "",
  assetManufacturer: "",
  assetManufacturedAt: null,
  assetModelName: "",
  assetSn: "",
  empId: "",
  assetLoc: "",
  assetIssuanceDate: null,
  assetDesc: "",
  _errors: {},
});

export default function RegistAssetDialog({ open, onClose }) {
  const [step, setStep] = useState("entry"); // entry | form
  const [initialRows, setInitialRows] = useState(null);

  useEffect(() => {
    if (!open) {
      setStep("entry");
      setInitialRows(null);
    }
  }, [open]);

  const closeAll = () => {
    setStep("entry");
    setInitialRows(null);
    onClose?.();
  };

  const onPickDirect = () => {
    setInitialRows([makeEmptyRow()]);
    setStep("form");
  };

  const onExcelPrefill = (rows) => {
    const safe = Array.isArray(rows) && rows.length ? rows : [makeEmptyRow()];
    setInitialRows(safe);
    setStep("form");
  };

  return (
    <>
      <RegistEntryDialog
        open={open && step === "entry"}
        onClose={closeAll}
        onPickDirect={onPickDirect}
        onExcelPrefill={onExcelPrefill}
      />

      <Dialog
        open={open && step === "form"}
        onClose={() => {}}
        // fullWidth
        // maxWidth="xl"
        PaperProps={{
          sx: { width: "100vw", maxWidth: 1800, m: "auto", borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pr: 6, position: "relative" }}>
          <IconButton
            onClick={closeAll}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {initialRows && (
            <RegistFormDialog onClose={closeAll} initialRows={initialRows} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
