// Selección ponderada pura, sin DOM. Los pesos no necesitan sumar 100:
// se normalizan aquí como peso / sumaTotalDePesos.
export function elegirPremio(premios) {
  const activos = premios.filter((p) => p.peso > 0);
  if (activos.length === 0) {
    throw new Error('No hay premios con peso > 0 para elegir');
  }

  const total = activos.reduce((suma, p) => suma + p.peso, 0);
  let r = Math.random() * total;

  for (const premio of activos) {
    if (r < premio.peso) return premio;
    r -= premio.peso;
  }

  // Fallback por redondeo de coma flotante.
  return activos[activos.length - 1];
}
