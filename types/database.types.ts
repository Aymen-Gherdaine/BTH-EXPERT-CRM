export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adresse: string
          created_at: string | null
          entreprise: string
          id: string
          nom_contact: string
          poste: string
          titre: string
          ville: string
        }
        Insert: {
          adresse: string
          created_at?: string | null
          entreprise: string
          id?: string
          nom_contact: string
          poste: string
          titre: string
          ville: string
        }
        Update: {
          adresse?: string
          created_at?: string | null
          entreprise?: string
          id?: string
          nom_contact?: string
          poste?: string
          titre?: string
          ville?: string
        }
        Relationships: []
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          date_depense: string
          description: string | null
          employe_id: string
          id: string
          justificatif_url: string | null
          montant: number
          projet_lie: string | null
        }
        Insert: {
          categorie: string
          created_at?: string
          date_depense?: string
          description?: string | null
          employe_id: string
          id?: string
          justificatif_url?: string | null
          montant: number
          projet_lie?: string | null
        }
        Update: {
          categorie?: string
          created_at?: string
          date_depense?: string
          description?: string | null
          employe_id?: string
          id?: string
          justificatif_url?: string | null
          montant?: number
          projet_lie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depenses_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_projet_lie_fkey"
            columns: ["projet_lie"]
            isOneToOne: false
            referencedRelation: "soumissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_budget: {
        Row: {
          designation: string
          id: string
          numero: number
          ordre: number
          prix_unitaire: number
          quantite: number
          soumission_id: string | null
        }
        Insert: {
          designation: string
          id?: string
          numero: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          soumission_id?: string | null
        }
        Update: {
          designation?: string
          id?: string
          numero?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          soumission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_budget_soumission_id_fkey"
            columns: ["soumission_id"]
            isOneToOne: false
            referencedRelation: "soumissions"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres: {
        Row: {
          adresse: string
          delai_jours: number
          email_contact: string
          id: number
          modalites_paiement: string
          nom_societe: string
          signataire1_nom: string
          signataire1_titre: string
          signataire2_nom: string
          signataire2_titre: string
          signature_autorise_url: string | null
          signature_responsable_url: string | null
          site_web: string | null
          telephone: string
          tva_pct: number
          updated_at: string | null
          validite_jours: number
          ville: string
        }
        Insert: {
          adresse?: string
          delai_jours?: number
          email_contact?: string
          id?: number
          modalites_paiement?: string
          nom_societe?: string
          signataire1_nom?: string
          signataire1_titre?: string
          signataire2_nom?: string
          signataire2_titre?: string
          signature_autorise_url?: string | null
          signature_responsable_url?: string | null
          site_web?: string | null
          telephone?: string
          tva_pct?: number
          updated_at?: string | null
          validite_jours?: number
          ville?: string
        }
        Update: {
          adresse?: string
          delai_jours?: number
          email_contact?: string
          id?: number
          modalites_paiement?: string
          nom_societe?: string
          signataire1_nom?: string
          signataire1_titre?: string
          signataire2_nom?: string
          signataire2_titre?: string
          signature_autorise_url?: string | null
          signature_responsable_url?: string | null
          site_web?: string | null
          telephone?: string
          tva_pct?: number
          updated_at?: string | null
          validite_jours?: number
          ville?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          adresse: string
          created_at: string | null
          created_by: string
          email: string | null
          entreprise: string
          etape: string
          id: string
          nom_contact: string
          notes_generales: string | null
          poste_contact: string
          raison_perte: string | null
          secteur_activite: string
          statut_global: string
          telephone: string
          updated_at: string | null
        }
        Insert: {
          adresse: string
          created_at?: string | null
          created_by: string
          email?: string | null
          entreprise: string
          etape?: string
          id?: string
          nom_contact: string
          notes_generales?: string | null
          poste_contact: string
          raison_perte?: string | null
          secteur_activite: string
          statut_global?: string
          telephone: string
          updated_at?: string | null
        }
        Update: {
          adresse?: string
          created_at?: string | null
          created_by?: string
          email?: string | null
          entreprise?: string
          etape?: string
          id?: string
          nom_contact?: string
          notes_generales?: string | null
          poste_contact?: string
          raison_perte?: string | null
          secteur_activite?: string
          statut_global?: string
          telephone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      soumissions: {
        Row: {
          client_id: string | null
          contexte_genere: string | null
          created_at: string | null
          date_offre: string
          delai_jours: number
          description_projet: string
          id: string
          numero_offre: string
          secteur_activite: string
          statut: string
          titre_projet: string
          total_ht: number
          total_ttc: number
          tva: number
          type_etude: string
          versement_recu: number | null
        }
        Insert: {
          client_id?: string | null
          contexte_genere?: string | null
          created_at?: string | null
          date_offre?: string
          delai_jours?: number
          description_projet: string
          id?: string
          numero_offre: string
          secteur_activite: string
          statut?: string
          titre_projet: string
          total_ht?: number
          total_ttc?: number
          tva?: number
          type_etude: string
          versement_recu?: number | null
        }
        Update: {
          client_id?: string | null
          contexte_genere?: string | null
          created_at?: string | null
          date_offre?: string
          delai_jours?: number
          description_projet?: string
          id?: string
          numero_offre?: string
          secteur_activite?: string
          statut?: string
          titre_projet?: string
          total_ht?: number
          total_ttc?: number
          tva?: number
          type_etude?: string
          versement_recu?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soumissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      visites: {
        Row: {
          action_requise: string | null
          commercial_id: string
          created_at: string | null
          date_prochaine_action: string | null
          date_visite: string
          id: string
          notes_visite: string | null
          prospect_id: string
          resultat: string
        }
        Insert: {
          action_requise?: string | null
          commercial_id: string
          created_at?: string | null
          date_prochaine_action?: string | null
          date_visite: string
          id?: string
          notes_visite?: string | null
          prospect_id: string
          resultat: string
        }
        Update: {
          action_requise?: string | null
          commercial_id?: string
          created_at?: string | null
          date_prochaine_action?: string | null
          date_visite?: string
          id?: string
          notes_visite?: string | null
          prospect_id?: string
          resultat?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visites_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "admin" | "charge_projet" | "commercial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "charge_projet", "commercial"],
    },
  },
} as const
