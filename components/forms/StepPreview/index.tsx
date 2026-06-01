"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EditableSection from "@/components/soumissions/EditableSection";
import type { StepPreviewProps } from "./types";
import { DARK_BLUE, MID_BLUE, LIGHT_BLUE, BTH_GREEN } from "./constants";
import { useLeaveGuard } from "./hooks/useLeaveGuard";
import { useSectionEdit } from "./hooks/useSectionEdit";
import { useExport } from "./hooks/useExport";
import { SectionSwitchModal, LeaveGuardModal, RegenerateModal } from "./modals";
import { BudgetSection, FlashWrapper } from "./components";

export default function StepPreview({
  step1,
  step2,
  step3,
  aiContent,
  saving,
  onBack,
  onSave,
  soumissionId,
  clientId,
  parametres,
}: StepPreviewProps) {
  const [isDirty, setIsDirty] = useState(false);

  const {
    editablePreview,
    activeSection,
    pendingSection,
    savedSections,
    flashingSections,
    unsavedSections,
    saveError: sectionSaveError,
    draftLignes,
    setDraftLignes,
    budgetSectionRef,
    showRegenerateModal,
    setShowRegenerateModal,
    regenerating,
    requestEdit,
    handleCancel,
    confirmSwitch,
    cancelSwitch,
    handleSave,
    handleBudgetSave,
    handleRegenerate,
  } = useSectionEdit({ step1, step2, step3, aiContent, soumissionId, clientId, setIsDirty });

  const total_ht = editablePreview.lignes_budget.reduce(
    (s, l) => s + l.quantite * l.prix_unitaire,
    0
  );
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;

  const {
    showLeaveModal,
    setShowLeaveModal,
    savingDraft,
    saveError: leaveSaveError,
    requestLeave,
    confirmLeave,
    handleSaveAsDraft,
  } = useLeaveGuard({ isDirty, setIsDirty, soumissionId, step2, editablePreview, total_ht, tva, total_ttc });

  const { exporting, handleExport } = useExport({
    editablePreview, soumissionId, clientId, step2, total_ht, tva, total_ttc, parametres,
  });

  const hasUnsaved = unsavedSections.size > 0;
  const saveError = sectionSaveError ?? leaveSaveError;

  return (
    <div className="p-4 md:p-8">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prévisualisation</h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Survolez une section pour la modifier
          </p>
          <AnimatePresence>
            {hasUnsaved && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 text-xs text-orange-500 mt-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                Modifications non sauvegardées
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={!!exporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {exporting === "docx" ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            .docx
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto rounded-lg text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50 hover:opacity-90 min-h-[44px]"
            style={{ backgroundColor: BTH_GREEN }}
          >
            {exporting === "pdf" ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            .pdf
          </button>
        </div>
      </div>

      <div className="space-y-3">

        {/* BLOCK 1 — Destinataire */}
        <EditableSection
          title="Destinataire"
          accentColor={DARK_BLUE}
          isEditing={activeSection === "destinataire"}
          showSaved={savedSections.has("destinataire")}
          onEditRequest={() => requestEdit("destinataire")}
          onSave={(u) => handleSave("destinataire", u)}
          onCancel={handleCancel}
          fields={[
            { key: "titre", label: "Civilité", value: editablePreview.titre },
            { key: "nom_contact", label: "Nom et prénom", value: editablePreview.nom_contact },
            { key: "poste_contact", label: "Poste", value: editablePreview.poste_contact },
            { key: "entreprise", label: "Entreprise", value: editablePreview.entreprise },
            { key: "adresse", label: "Adresse", value: editablePreview.adresse },
            { key: "ville", label: "Ville", value: editablePreview.ville },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4">
              <p className="text-sm font-semibold text-gray-900">
                {editablePreview.titre} {editablePreview.nom_contact},{" "}
                {editablePreview.poste_contact}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{editablePreview.entreprise}</p>
              <p className="text-sm text-gray-500">{editablePreview.adresse}</p>
              <p className="text-sm text-gray-500">{editablePreview.ville}</p>
            </div>
          }
        />

        {/* BLOCK 2 — Référence offre */}
        <EditableSection
          title="Référence offre"
          accentColor={DARK_BLUE}
          isEditing={activeSection === "objet"}
          showSaved={savedSections.has("objet")}
          onEditRequest={() => requestEdit("objet")}
          onSave={(u) => handleSave("objet", u)}
          onCancel={handleCancel}
          fields={[
            { key: "numero_offre", label: "N° offre", value: editablePreview.numero_offre },
            { key: "date_offre", label: "Date", value: editablePreview.date_offre },
            { key: "titre_projet", label: "Titre du projet", value: editablePreview.titre_projet },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Objet</p>
                <p className="text-sm font-semibold" style={{ color: BTH_GREEN }}>
                  Offre de services professionnels
                </p>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {editablePreview.titre_projet}
                </p>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">N° Offre</p>
                <p className="font-bold text-sm" style={{ color: BTH_GREEN }}>
                  {editablePreview.numero_offre}
                </p>
                <p className="text-xs text-gray-400 mt-1">{editablePreview.date_offre}</p>
              </div>
            </div>
          }
        />

        {/* BLOCK 3 — Intro */}
        <EditableSection
          title="Paragraphe d'introduction"
          accentColor={DARK_BLUE}
          isEditing={activeSection === "intro"}
          showSaved={savedSections.has("intro")}
          onEditRequest={() => requestEdit("intro")}
          onSave={(u) => handleSave("intro", u)}
          onCancel={handleCancel}
          fields={[
            {
              key: "intro_paragraphe",
              label: "Texte d'introduction",
              value: editablePreview.intro_paragraphe,
              multiline: true,
            },
          ]}
          renderContent={
            <div className="pl-5 pr-4 pb-4 bg-[#F4F6F7] rounded-b-xl text-sm text-gray-700 leading-relaxed">
              {editablePreview.intro_paragraphe.split("\n\n").map((para, i) => (
                <p key={i} className={i > 0 ? "mt-2" : "pt-4"}>{para}</p>
              ))}
              <div className="pb-0.5" />
            </div>
          }
        />

        {/* BLOCK 4 — Contexte */}
        <FlashWrapper sectionId="contexte" color={MID_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Contexte et objectifs"
            accentColor={MID_BLUE}
            isEditing={activeSection === "contexte"}
            showSaved={savedSections.has("contexte")}
            onEditRequest={() => requestEdit("contexte")}
            onSave={(u) => handleSave("contexte", u)}
            onCancel={handleCancel}
            fields={[
              { key: "contexte_paragraphe_1", label: "Paragraphe 1", value: editablePreview.contexte_paragraphe_1, multiline: true },
              { key: "contexte_paragraphe_2", label: "Paragraphe 2", value: editablePreview.contexte_paragraphe_2, multiline: true },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4 space-y-3">
                {[editablePreview.contexte_paragraphe_1, editablePreview.contexte_paragraphe_2]
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
                  ))}
              </div>
            }
          />
        </FlashWrapper>

        {/* BLOCK 5 — Objectifs */}
        <FlashWrapper sectionId="objectifs" color={MID_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Objectifs du projet"
            accentColor={MID_BLUE}
            isEditing={activeSection === "objectifs"}
            showSaved={savedSections.has("objectifs")}
            onEditRequest={() => requestEdit("objectifs")}
            onSave={(u) => handleSave("objectifs", u)}
            onCancel={handleCancel}
            fields={[
              { key: "objectif_1", label: "Objectif 1", value: editablePreview.objectif_1, multiline: true },
              { key: "objectif_2", label: "Objectif 2", value: editablePreview.objectif_2, multiline: true },
              { key: "objectif_3", label: "Objectif 3", value: editablePreview.objectif_3, multiline: true },
              { key: "objectif_4", label: "Objectif 4", value: editablePreview.objectif_4, multiline: true },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4">
                <p className="text-sm text-gray-500 mb-2.5">
                  Les objectifs du projet et du mandat sont les suivants :
                </p>
                <ol className="space-y-2">
                  {[editablePreview.objectif_1, editablePreview.objectif_2, editablePreview.objectif_3, editablePreview.objectif_4]
                    .filter(Boolean)
                    .map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="shrink-0 font-semibold text-xs mt-0.5" style={{ color: MID_BLUE }}>{i + 1}.</span>
                        <span className="leading-relaxed">{obj}</span>
                      </li>
                    ))}
                </ol>
              </div>
            }
          />
        </FlashWrapper>

        {/* BLOCK 6 — Livrables */}
        <FlashWrapper sectionId="livrables" color={LIGHT_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Livrables"
            accentColor={LIGHT_BLUE}
            isEditing={activeSection === "livrables"}
            showSaved={savedSections.has("livrables")}
            onEditRequest={() => requestEdit("livrables")}
            onSave={(u) => handleSave("livrables", u)}
            onCancel={handleCancel}
            fields={[
              { key: "livrable_1", label: "Livrable 1", value: editablePreview.livrable_1 },
              { key: "livrable_2", label: "Livrable 2", value: editablePreview.livrable_2 },
              { key: "livrable_3", label: "Livrable 3", value: editablePreview.livrable_3 },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4">
                <ol className="space-y-2">
                  {[editablePreview.livrable_1, editablePreview.livrable_2, editablePreview.livrable_3]
                    .filter(Boolean)
                    .map((liv, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="shrink-0 font-semibold text-xs mt-0.5" style={{ color: LIGHT_BLUE }}>L{i + 1}.</span>
                        <span className="leading-relaxed">{liv}</span>
                      </li>
                    ))}
                </ol>
              </div>
            }
          />
        </FlashWrapper>

        {/* BLOCK 7 — Hypothèses */}
        <FlashWrapper sectionId="hypotheses" color={LIGHT_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Hypothèses"
            accentColor={LIGHT_BLUE}
            isEditing={activeSection === "hypotheses"}
            showSaved={savedSections.has("hypotheses")}
            onEditRequest={() => requestEdit("hypotheses")}
            onSave={(u) => handleSave("hypotheses", u)}
            onCancel={handleCancel}
            fields={[
              {
                key: "hypothese_specifique",
                label: "Hypothèses de travail",
                value: editablePreview.hypothese_specifique,
                multiline: true,
              },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4 space-y-2.5">
                {editablePreview.hypothese_specifique
                  .split("\n\n")
                  .filter(Boolean)
                  .map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-xs mt-0.5" style={{ color: LIGHT_BLUE }}>H{i + 1}.</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{h.trim()}</p>
                    </div>
                  ))}
              </div>
            }
          />
        </FlashWrapper>

        {/* BLOCK 8 — Échéancier */}
        <FlashWrapper sectionId="echeancier" color={LIGHT_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Échéancier"
            accentColor={LIGHT_BLUE}
            isEditing={activeSection === "echeancier"}
            showSaved={savedSections.has("echeancier")}
            onEditRequest={() => requestEdit("echeancier")}
            onSave={(u) => handleSave("echeancier", u)}
            onCancel={handleCancel}
            fields={[
              {
                key: "description_echeancier",
                label: "Description délai",
                value: editablePreview.description_echeancier,
                multiline: true,
              },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {editablePreview.description_echeancier}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-[#F4F6F7] rounded-lg px-3 py-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">
                    {step2.delai_jours} jours
                  </span>
                </div>
              </div>
            }
          />
        </FlashWrapper>

        {/* BLOCK 9 — Inclusions et exclusions */}
        <FlashWrapper sectionId="perimetre" color={LIGHT_BLUE} flashingSections={flashingSections}>
          <EditableSection
            title="Inclusions et exclusions"
            accentColor={LIGHT_BLUE}
            isEditing={activeSection === "perimetre"}
            showSaved={savedSections.has("perimetre")}
            onEditRequest={() => requestEdit("perimetre")}
            onSave={(u) => handleSave("perimetre", u)}
            onCancel={handleCancel}
            fields={[
              { key: "inclusions_specifiques", label: "Inclusions", value: editablePreview.inclusions_specifiques, multiline: true },
              { key: "exclusions_specifiques", label: "Exclusions", value: editablePreview.exclusions_specifiques, multiline: true },
            ]}
            renderContent={
              <div className="pl-5 pr-4 pb-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700 mb-1.5">
                    Inclus dans l'offre
                  </p>
                  <ul className="space-y-1">
                    {editablePreview.inclusions_specifiques
                      .split("\n")
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{item.trim()}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600 mb-1.5">
                    Non inclus / Exclusions
                  </p>
                  <ul className="space-y-1">
                    {editablePreview.exclusions_specifiques
                      .split("\n")
                      .filter(Boolean)
                      .map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                          <span className="leading-relaxed">{item.trim()}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            }
          />
        </FlashWrapper>

        {/* Regenerate AI button */}
        <div className="flex justify-center py-1">
          <button
            type="button"
            onClick={() => setShowRegenerateModal(true)}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {regenerating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {regenerating ? "Régénération en cours…" : "Régénérer les sections IA"}
          </button>
        </div>

        {/* BLOCK 10 — Budget */}
        <BudgetSection
          activeSection={activeSection}
          savedSections={savedSections}
          draftLignes={draftLignes}
          setDraftLignes={setDraftLignes}
          lignes={editablePreview.lignes_budget}
          budgetSectionRef={budgetSectionRef}
          onEditRequest={() => requestEdit("budget")}
          onSave={handleBudgetSave}
          onCancel={handleCancel}
        />

        {/* Signataires */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-2">Responsable de l'offre :</p>
            <p className="font-semibold text-sm" style={{ color: BTH_GREEN }}>{parametres?.signataire1_nom ?? "—"}</p>
            <p className="text-xs text-gray-400">{parametres?.signataire1_titre ?? ""}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Autorisé par :</p>
            <p className="font-semibold text-sm" style={{ color: BTH_GREEN }}>{parametres?.signataire2_nom ?? "—"}</p>
            <p className="text-xs text-gray-400">{parametres?.signataire2_titre ?? ""}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={() => requestLeave(onBack)}
          className="flex items-center justify-center gap-2 px-5 min-h-[44px] w-full sm:w-auto rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <button
          type="button"
          onClick={() => { setIsDirty(false); onSave(); }}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 min-h-[44px] w-full sm:w-auto rounded-xl text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: BTH_GREEN }}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sauvegarde…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegarder et terminer
            </>
          )}
        </button>
      </div>

      {/* Modals */}
      <SectionSwitchModal
        open={!!pendingSection}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />
      <LeaveGuardModal
        open={showLeaveModal}
        savingDraft={savingDraft}
        onStay={() => setShowLeaveModal(false)}
        onSaveDraft={handleSaveAsDraft}
        onConfirmLeave={confirmLeave}
      />
      <RegenerateModal
        open={showRegenerateModal}
        regenerating={regenerating}
        onRegenerate={handleRegenerate}
        onClose={() => setShowRegenerateModal(false)}
      />

      {/* Save error toast */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 16, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
          >
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
