import { Importer } from "./importer";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Importar Excel</h1>
      <p className="text-sm text-muted">
        Elegí tu archivo de finanzas. Las filas con fecha entran como movimientos y las filas sin fecha como gastos
        fijos del mes. Las categorías se asignan solas; después las podés cambiar. Importalo una sola vez para no
        duplicar datos.
      </p>
      <Importer />
    </div>
  );
}
