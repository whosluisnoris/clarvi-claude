/**
 * Tipos generados desde el esquema de Supabase. NO editar a mano.
 *
 * Se regeneran con el MCP de Supabase (generate_typescript_types) o con
 * `supabase gen types typescript` después de aplicar una migración nueva.
 * Se versionan a propósito (brief §18): así el typecheck de CI falla si el
 * código y el esquema se separan.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip: unknown;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: unknown;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: unknown;
          metadata?: Json;
        };
        Relationships: [];
      };
      cohorts: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          starts_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          starts_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          starts_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_access: {
        Row: {
          content_id: string;
          content_type: Database["public"]["Enums"]["tipo_contenido"];
          created_at: string;
          id: string;
          principal_id: string;
          principal_type: Database["public"]["Enums"]["tipo_principal"];
        };
        Insert: {
          content_id: string;
          content_type: Database["public"]["Enums"]["tipo_contenido"];
          created_at?: string;
          id?: string;
          principal_id: string;
          principal_type: Database["public"]["Enums"]["tipo_principal"];
        };
        Update: {
          content_id?: string;
          content_type?: Database["public"]["Enums"]["tipo_contenido"];
          created_at?: string;
          id?: string;
          principal_id?: string;
          principal_type?: Database["public"]["Enums"]["tipo_principal"];
        };
        Relationships: [];
      };
      login_attempts: {
        Row: {
          created_at: string;
          exitoso: boolean;
          id: number;
          ip: unknown;
          username_intento: string;
        };
        Insert: {
          created_at?: string;
          exitoso: boolean;
          id?: never;
          ip?: unknown;
          username_intento: string;
        };
        Update: {
          created_at?: string;
          exitoso?: boolean;
          id?: never;
          ip?: unknown;
          username_intento?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          cohort_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_active: boolean;
          last_login_at: string | null;
          notes: string | null;
          role: Database["public"]["Enums"]["rol_usuario"];
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          cohort_id?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          is_active?: boolean;
          last_login_at?: string | null;
          notes?: string | null;
          role?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          cohort_id?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          notes?: string | null;
          role?: Database["public"]["Enums"]["rol_usuario"];
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_cohort_id_fkey";
            columns: ["cohort_id"];
            isOneToOne: false;
            referencedRelation: "cohorts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      ajustes_publicos: { Args: never; Returns: Json };
      cohorte_actual: { Args: never; Returns: string };
      es_admin: { Args: never; Returns: boolean };
      usuario_activo: { Args: never; Returns: boolean };
    };
    Enums: {
      rol_usuario: "admin" | "participante";
      tipo_contenido: "topic" | "resource" | "assessment" | "prompt";
      tipo_principal: "cohort" | "user";
      visibilidad_contenido: "publico" | "restringido";
    };
    CompositeTypes: Record<never, never>;
  };
};

type EsquemaPublico = Database["public"];

export type Fila<T extends keyof EsquemaPublico["Tables"]> =
  EsquemaPublico["Tables"][T]["Row"];
export type Insercion<T extends keyof EsquemaPublico["Tables"]> =
  EsquemaPublico["Tables"][T]["Insert"];
export type Actualizacion<T extends keyof EsquemaPublico["Tables"]> =
  EsquemaPublico["Tables"][T]["Update"];
export type Enumeracion<T extends keyof EsquemaPublico["Enums"]> =
  EsquemaPublico["Enums"][T];

export type Perfil = Fila<"profiles">;
export type Cohorte = Fila<"cohorts">;
export type RolUsuario = Enumeracion<"rol_usuario">;
