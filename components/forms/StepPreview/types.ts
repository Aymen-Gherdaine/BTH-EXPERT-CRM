import type { FormDataStep1, FormDataStep2, FormDataStep3 } from "@/types";
import type { SoumissionAIContent } from "@/lib/anthropic";

export interface StepPreviewProps {
  step1: FormDataStep1;
  step2: FormDataStep2;
  step3: FormDataStep3;
  aiContent: SoumissionAIContent;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  soumissionId?: string;
  clientId?: string;
  parametres?: {
    signataire1_nom?: string | null;
    signataire1_titre?: string | null;
    signataire2_nom?: string | null;
    signataire2_titre?: string | null;
  } | null;
}
