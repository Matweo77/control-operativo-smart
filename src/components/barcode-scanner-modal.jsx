"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff, ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BarcodeScannerModal({ open, onOpenChange, onDetected }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [starting, setStarting] = useState(false);
  const scannerRef = useRef(null);
  const lockedRef = useRef(false);
  const regionId = "smartpos-qr-reader";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    lockedRef.current = false;
    setErrorMsg("");
    setStarting(true);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (cancelled || lockedRef.current) return;
            const cleanCode = String(decodedText || "").trim();
            if (!cleanCode) return;

            lockedRef.current = true;
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(80);
            }
            if (typeof onDetected === "function") {
              onDetected(cleanCode);
            }
            onOpenChange(false);
          },
          () => {
            // Lectura en curso: se ignora cada frame sin código detectado
          },
        );
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err?.message ||
              "No se pudo acceder a la cámara. Verifica permisos y que estés usando HTTPS o localhost.",
          );
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    const timer = setTimeout(startScanner, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) {
        instance
          .stop()
          .then(() => instance.clear())
          .catch(() => {});
      }
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="size-5" />
            Escanear código de barras
          </DialogTitle>
          <DialogDescription>
            Apunta la cámara trasera al código impreso del producto. Al detectarlo
            se agregará al ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {errorMsg ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center text-xs text-destructive">
              <CameraOff className="size-6" />
              <p>{errorMsg}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <div id={regionId} className="min-h-[240px] w-full" />
            </div>
          )}

          {starting && !errorMsg && (
            <p className="text-center text-xs text-muted-foreground">
              Iniciando cámara...
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
          >
            <X className="size-4" />
            Cerrar cámara
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}