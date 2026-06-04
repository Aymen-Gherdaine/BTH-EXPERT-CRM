"use client";

import { useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatMontant } from "@/lib/utils";
import { VersementState } from "../types";

export function VersementModal({ versement, onCancel, versementInput, setVersementInput, onSave, saving }: {
  versement: VersementState;
  onCancel: () => void;
  versementInput: string;
  setVersementInput: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const inputId = useId();
  const helpId = useId();

  return (
    <Modal
      open={versement.open}
      onClose={onCancel}
      dismissable={!saving}
      title="Versement reçu"
      subtitle={versement.titre}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            loading={saving}
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <div className="flex justify-between mb-4 px-3.5 py-2.5 bg-bth-surface-2 rounded-bth-md">
        <span className="text-[13px] text-bth-n-600">Montant TTC</span>
        <span className="text-[13px] font-bold text-bth-n-900 tnum">
          {formatMontant(versement.ttc)} DZD
        </span>
      </div>
      <label
        htmlFor={inputId}
        className="block text-[13px] font-semibold text-bth-n-700 mb-1.5"
      >
        Montant versé (DZD)
      </label>
      <input
        id={inputId}
        aria-describedby={helpId}
        type="number"
        value={versementInput}
        onChange={(e) => setVersementInput(e.target.value)}
        placeholder="Ex : 500000"
        min={0}
        autoFocus
        className="w-full px-3.5 py-2.5 border-[1.5px] border-bth-hairline-strong rounded-bth-md text-[14px] bth-focus mb-1.5"
      />
      <p id={helpId} className="text-[11.5px] text-bth-n-500">
        Acompte ou paiement partiel reçu du client.
      </p>
    </Modal>
  );
}
