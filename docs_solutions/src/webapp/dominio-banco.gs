// Lectura de los ficheros del banco: reglas puras, sin servicios de Google (ADR-0019). HU-49 · RF-90.
//
// Formatos: remesa XML ISO 20022 (pain.001.001.09), y el listado del banco en CSV (el .xls exportado). El Excel se
// convierte a CSV antes de llegar aquí. Cada fichero se lee ENTERO o se rechaza: si el número de pagos o la suma no
// cuadran con lo que declara el propio fichero, se niega (un cruce sobre un fichero parcial da un informe falso).
//
// Los mensajes dicen QUÉ falla y en qué fichero, nunca el nombre del beneficiario ni la cuenta (RNF-19).

const FORMATOS_BANCO = ['.xml', '.csv', '.txt'];
const TOLERANCIA_SUMA_CENTIMOS = 1;

function quitarTildes_(texto) {
  return textoDe_(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function decodificarXml_(texto) {
  return texto
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function primeraEtiqueta_(bloque, expresion) {
  const encontrada = expresion.exec(bloque);
  return encontrada ? decodificarXml_(encontrada[1].trim()) : '';
}

/** Entidad del banco del beneficiario: su BIC si lo trae; si no, el código de entidad del IBAN español. */
function entidadDelBanco_(bic, iban) {
  if (textoDe_(bic) !== '') return textoDe_(bic);
  return /^ES\d{2}\d{4}/.test(iban) ? `Entidad ${iban.slice(4, 8)}` : '';
}

function pagoDeXml_(transaccion, nombreFichero) {
  const iban = normalizarIban_(primeraEtiqueta_(transaccion, /<CdtrAcct>[\s\S]*?<IBAN>([^<]*)<\/IBAN>/));
  const referenciaPago = primeraEtiqueta_(transaccion, /<EndToEndId>([^<]*)<\/EndToEndId>/);
  const concepto = primeraEtiqueta_(transaccion, /<Ustrd>([^<]*)<\/Ustrd>/);
  return {
    nombre: primeraEtiqueta_(transaccion, /<Cdtr>\s*<Nm>([^<]*)<\/Nm>/),
    iban,
    importe: primeraEtiqueta_(transaccion, /<InstdAmt[^>]*>([^<]*)<\/InstdAmt>/),
    referencia: referenciaPago && referenciaPago !== 'NOTPROVIDED' ? referenciaPago : concepto,
    banco: entidadDelBanco_(primeraEtiqueta_(transaccion, /<CdtrAgt>[\s\S]*?<BICFI>([^<]*)<\/BICFI>/), iban),
    fichero: nombreFichero,
  };
}

function leerXmlBanco_(texto, nombreFichero) {
  if (/<!DOCTYPE|<!ENTITY/i.test(texto))
    return {
      formato: 'xml',
      pagos: [],
      declarado: null,
      errores: [`«${nombreFichero}»: el XML trae una definición no permitida.`],
    };
  const transacciones = [...texto.matchAll(/<CdtTrfTxInf>([\s\S]*?)<\/CdtTrfTxInf>/g)].map((m) => m[1]);
  const cabecera = /<GrpHdr>([\s\S]*?)<\/GrpHdr>/.exec(texto);
  const declarado = cabecera
    ? {
        numero: Number(primeraEtiqueta_(cabecera[1], /<NbOfTxs>([^<]*)<\/NbOfTxs>/)),
        importeCentimos: aCentimos_(primeraEtiqueta_(cabecera[1], /<CtrlSum>([^<]*)<\/CtrlSum>/)),
      }
    : null;
  return { formato: 'xml', pagos: transacciones.map((t) => pagoDeXml_(t, nombreFichero)), declarado, errores: [] };
}

/** CSV con comillas: devuelve una lista de filas, cada una una lista de celdas. */
function parsearCsv_(texto, delimitador) {
  const filas = [];
  let fila = [];
  let celda = '';
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i += 1;
      } else if (c === '"') entreComillas = false;
      else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === delimitador) {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i += 1;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

function delimitadorDe_(texto) {
  const muestra = texto.split(/\r?\n/).filter((l) => /beneficiario/i.test(l))[0] || texto.split(/\r?\n/)[0] || '';
  const cuentas = [';', '\t', ','].map((d) => ({ d, n: muestra.split(d).length }));
  return cuentas.sort((a, b) => b.n - a.n)[0].d;
}

function indiceDeColumna_(cabecera, ...nombres) {
  const limpias = cabecera.map(quitarTildes_);
  for (const nombre of nombres) {
    const posicion = limpias.indexOf(nombre);
    if (posicion !== -1) return posicion;
  }
  return -1;
}

/** Lo que declara el preámbulo del listado: «Número de pagos» e «Importe total». */
function declaradoDelPreambulo_(filas, indiceCabecera) {
  const valorDe = (inicio) => {
    const fila = filas.slice(0, indiceCabecera).filter((f) => quitarTildes_(f[0]).indexOf(inicio) === 0)[0];
    return fila ? fila.slice(1).filter((c) => textoDe_(c) !== '')[0] : undefined;
  };
  const numero = valorDe('numero de pagos');
  const importe = valorDe('importe total');
  if (numero === undefined && importe === undefined) return null;
  return {
    numero: numero === undefined ? NaN : Number(textoDe_(numero).replace(/\./g, '')),
    importeCentimos: importe === undefined ? NaN : aCentimos_(importe),
  };
}

function leerCsvBanco_(texto, nombreFichero) {
  const filas = parsearCsv_(texto, delimitadorDe_(texto));
  const indiceCabecera = filas.findIndex(
    (f) =>
      indiceDeColumna_(f, 'beneficiario') !== -1 &&
      indiceDeColumna_(f, 'cuenta de abono', 'cuenta', 'iban') !== -1 &&
      indiceDeColumna_(f, 'importe') !== -1,
  );
  if (indiceCabecera === -1) {
    return {
      formato: 'csv',
      pagos: [],
      declarado: null,
      errores: [`«${nombreFichero}»: no se encuentra la cabecera (Beneficiario, Cuenta de abono, Importe).`],
    };
  }
  const cabecera = filas[indiceCabecera];
  const col = {
    nombre: indiceDeColumna_(cabecera, 'beneficiario'),
    iban: indiceDeColumna_(cabecera, 'cuenta de abono', 'cuenta', 'iban'),
    importe: indiceDeColumna_(cabecera, 'importe'),
  };
  const pagos = filas
    .slice(indiceCabecera + 1)
    .filter((f) => textoDe_(f[col.iban]) !== '' || textoDe_(f[col.importe]) !== '')
    .map((f) => {
      const iban = normalizarIban_(f[col.iban]);
      return {
        nombre: textoDe_(f[col.nombre]),
        iban,
        importe: textoDe_(f[col.importe]),
        referencia: '',
        banco: entidadDelBanco_('', iban),
        fichero: nombreFichero,
      };
    });
  return { formato: 'csv', pagos, declarado: declaradoDelPreambulo_(filas, indiceCabecera), errores: [] };
}

/** Comprueba que lo leído cuadra con lo que declara el propio fichero. Devuelve la lista de errores. */
function comprobarIntegridad_(lectura, nombreFichero) {
  const errores = [];
  if (lectura.pagos.length === 0) errores.push(`«${nombreFichero}»: no trae ningún pago.`);
  const declarado = lectura.declarado;
  if (!declarado) return errores;
  if (Number.isFinite(declarado.numero) && declarado.numero !== lectura.pagos.length) {
    errores.push(
      `«${nombreFichero}»: declara ${declarado.numero} pagos y trae ${lectura.pagos.length}. Está incompleto.`,
    );
  }
  if (Number.isInteger(declarado.importeCentimos)) {
    const suma = lectura.pagos.reduce(
      (total, p) => total + (Number.isInteger(aCentimos_(p.importe)) ? aCentimos_(p.importe) : 0),
      0,
    );
    if (Math.abs(suma - declarado.importeCentimos) > TOLERANCIA_SUMA_CENTIMOS) {
      errores.push(
        `«${nombreFichero}»: declara un importe total de ${formatearCentimos_(declarado.importeCentimos)} y la suma de los pagos es ${formatearCentimos_(suma)}. Está incompleto.`,
      );
    }
  }
  return errores;
}

function extensionDe_(nombre) {
  const encontrada = /(\.[A-Za-z0-9]+)$/.exec(textoDe_(nombre));
  return encontrada ? encontrada[1].toLowerCase() : '';
}

/** Un fichero: { formato, pagos, declarado, errores }. Si hay errores, no hay que usar sus pagos. */
function leerFicheroBanco_(texto, nombreFichero) {
  const nombre = textoDe_(nombreFichero) || 'fichero';
  if (FORMATOS_BANCO.indexOf(extensionDe_(nombre)) === -1) {
    return {
      formato: '',
      pagos: [],
      declarado: null,
      errores: [`«${nombre}»: formato no admitido (se admiten ${FORMATOS_BANCO.join(', ')}).`],
    };
  }
  const contenido = String(texto === null || texto === undefined ? '' : texto).replace(/^﻿/, '');
  if (contenido.trim() === '')
    return { formato: '', pagos: [], declarado: null, errores: [`«${nombre}»: está vacío.`] };
  const lectura = extensionDe_(nombre) === '.xml' ? leerXmlBanco_(contenido, nombre) : leerCsvBanco_(contenido, nombre);
  const errores = lectura.errores.length > 0 ? lectura.errores : comprobarIntegridad_(lectura, nombre);
  return Object.assign(lectura, { errores });
}

/** Varios ficheros de una empresa: TODOS o ninguno. Devuelve { pagos, errores }. */
function leerFicherosBanco_(ficheros) {
  if (!Array.isArray(ficheros) || ficheros.length === 0) return { pagos: [], errores: ['No hay ningún fichero.'] };
  const lecturas = ficheros.map((f) => leerFicheroBanco_((f || {}).texto, (f || {}).nombre));
  const errores = lecturas.reduce((todos, l) => todos.concat(l.errores), []);
  const pagos = errores.length > 0 ? [] : lecturas.reduce((todos, l) => todos.concat(l.pagos), []);
  return { pagos, errores };
}
