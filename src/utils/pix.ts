/**
 * PIX BR Code Payload Generator (BACEN / EMV Standard)
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid?: string;
}

export function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid = '***',
}: PixPayloadParams): string {
  // Normalize fields
  const cleanKey = key.trim();
  const cleanName = name.trim().slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanCity = city.trim().slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const formattedAmount = amount.toFixed(2);

  // Merchant Account Information (Tag 26)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKey = formatField('01', cleanKey);
  const merchantAccountInfo = formatField('26', `${gui}${pixKey}`);

  // Base EMV String without CRC
  const pfi = formatField('00', '01');
  const mcc = formatField('52', '0000');
  const currency = formatField('53', '986');
  const amountField = formatField('54', formattedAmount);
  const country = formatField('58', 'BR');
  const merchantName = formatField('59', cleanName || 'Moreninha');
  const merchantCity = formatField('60', cleanCity || 'Mesquita');

  // Additional Data (Tag 62)
  const txidField = formatField('05', cleanTxid);
  const additionalData = formatField('62', txidField);

  const payloadWithoutCRC = `${pfi}${merchantAccountInfo}${mcc}${currency}${amountField}${country}${merchantName}${merchantCity}${additionalData}6304`;
  const checksum = crc16(payloadWithoutCRC);

  return `${payloadWithoutCRC}${checksum}`;
}

export function getPixQrCodeUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(payload)}`;
}
