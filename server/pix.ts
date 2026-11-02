import QRCode from 'qrcode';

// CRC-16/CCITT-FALSE calculation as mandated by the Central Bank of Brazil (BACEN Pix standard)
function crc16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface GeneratePixParams {
  pixKey?: string;
  recipientName?: string;
  city?: string;
  amount: number;
  txId: string;
}

export async function generatePixChargePayload(params: GeneratePixParams): Promise<{ copyPasteCode: string; qrCodeSvg: string }> {
  const pixKey = params.pixKey || '11973479473';
  const rawRecipient = params.recipientName || 'Alifer Madeiro';
  // Normalize recipient name to ASCII (max 25 chars for EMV)
  const recipientName = rawRecipient
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25);
  const city = (params.city || 'SAO PAULO').substring(0, 15);
  const formattedAmount = params.amount.toFixed(2);
  const sanitizedTxId = params.txId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 1. Merchant Account Information (GUI + Key)
  const gui = emvField('00', 'br.gov.bcb.pix');
  const key = emvField('01', pixKey);
  const mai = emvField('26', `${gui}${key}`);

  // 2. Additional Data Field (TxID)
  const txField = emvField('05', sanitizedTxId);
  const additionalData = emvField('62', txField);

  // 3. Assemble payload up to CRC
  let rawPayload = 
    emvField('00', '01') + // Format Indicator
    mai +                  // Merchant Account Info
    emvField('52', '0000') + // Merchant Category Code
    emvField('53', '986') +  // Currency Code (986 = BRL)
    emvField('54', formattedAmount) + // Amount
    emvField('58', 'BR') +   // Country Code
    emvField('59', recipientName) + // Merchant Name
    emvField('60', city) +   // Merchant City
    additionalData +         // Additional Data
    '6304';                  // CRC tag + length placeholder

  // 4. Calculate checksum
  const crc = crc16(rawPayload);
  const copyPasteCode = `${rawPayload}${crc}`;

  // 5. Generate high-contrast, scalable SVG QR Code
  const qrCodeSvg = await QRCode.toString(copyPasteCode, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#050508',
      light: '#ffffff'
    }
  });

  return {
    copyPasteCode,
    qrCodeSvg
  };
}
