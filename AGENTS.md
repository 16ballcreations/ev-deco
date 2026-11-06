# Instrucciones para agentes · EV DecoInteriorismo

1. Lee primero `MARCA.md`: es la fuente de verdad de color, tipografía, la cota, tono y fotografía.
2. Usa solo los tokens de `assets/css/marca.css`; no agregues colores ni fuentes.
3. Toda imagen va rotulada «Render» o «Foto real». Un render nunca pasa por obra terminada.
4. Nada inventado: ni cifras, ni años, ni plazos, ni nombres de clientes o proyectos.
5. Máximo dos cotas visibles por pantalla (el logotipo cuenta como una).
6. Mientras sea propuesta, todas las páginas llevan `<meta name="robots" content="noindex">`.
7. Revisión local: `node herramientas/servir.mjs 4350`, en escritorio y a 375 px, sin desborde horizontal.
8. Las páginas se generan: edita `fuente/` (marco, páginas y `proyectos.json`) y corre `node herramientas/construir.mjs`. No edites los `index.html` generados.
9. Lo que el cliente no ha confirmado va como pendiente (`null` en `proyectos.json`, clase `pendiente` o `pendiente-dato`), nunca inventado.
10. Revisa los dos temas (botón sol/luna del menú): el texto dorado pequeño en el tema claro va en `--laton-profundo`.
