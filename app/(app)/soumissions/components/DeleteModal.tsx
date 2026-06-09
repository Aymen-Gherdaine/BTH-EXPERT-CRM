"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DeleteState } from "../types";
import { I } from "../constants";
import { Ic } from "./Ic";

export function DeleteModal({ deleteConfirm, onCancel, onConfirm, deletingId }: {
  deleteConfirm: DeleteState;
  onCancel: () => void;
  onConfirm: () => void;
  deletingId: string | null;
}) {
  return (
    <Modal
      open={deleteConfirm.open}
      onClose={onCancel}
      dismissable={!deletingId}
      title="Supprimer cette soumission ?"
      subtitle={deleteConfirm.label}
      icon={
        <div className="w-10 h-10 rounded-bth-lg bg-bth-error/10 flex items-center justify-center shrink-0">
          <Ic d={I.trash} z={20} s="var(--color-bth-error)" />
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={!!deletingId}
            disabled={!!deletingId}
            className="flex-1"
          >
            {deletingId ? "Suppression…" : "Supprimer"}
          </Button>
        </>
      }
    >
      Cette action est <strong>irréversible</strong>. La soumission et ses lignes
      budgétaires seront définitivement supprimées.
    </Modal>
  );
}
