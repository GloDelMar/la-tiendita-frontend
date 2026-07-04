export interface Caja {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export const FALLBACK_SINGLE_CAJA: Caja = {
  id: 1,
  nombre: 'CAFETERIA CAM 15',
  descripcion: 'Caja registradora unica',
  activa: true,
};
