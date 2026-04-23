import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { notifyCertificateIssued } from './notificationService';

const generateCertificateHtml = ({ donorName, ngoName, type, amount, itemsDelivered, date, certificateId }) => {
  const verifyUrl = `${window.location.origin}/verify/${certificateId}`;
  const detail = type === 'donation'
    ? `for donating <strong>&#8377;${amount}</strong>`
    : `for delivering <strong>${itemsDelivered}</strong>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Certificate - ${donorName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Georgia,serif;background:#F8F6F0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}
  .cert{background:white;max-width:620px;width:100%;padding:60px 50px;border:3px solid #FF6B35;border-radius:24px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.15);}
  .brand{color:#FF6B35;font-size:12px;font-family:Arial,sans-serif;letter-spacing:4px;text-transform:uppercase;}
  .badge{display:inline-block;background:#FF6B35;color:white;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:6px 18px;border-radius:100px;margin:16px 0 24px;}
  .title{color:#1A1A2E;font-size:26px;margin-bottom:8px;}
  .subtitle{color:#888;font-size:13px;font-family:Arial,sans-serif;margin-bottom:20px;}
  .donor{font-size:32px;color:#FF6B35;font-style:italic;margin:4px 0 16px;}
  .detail{font-size:15px;color:#333;line-height:1.8;margin-bottom:8px;}
  .ngo{font-size:20px;font-weight:bold;color:#1A1A2E;margin-bottom:30px;}
  .divider{border:none;border-top:1px solid #eee;margin:28px 0;}
  .meta{font-size:11px;color:#aaa;font-family:Arial,sans-serif;line-height:2.2;}
  .verify{margin-top:12px;font-size:10px;color:#FF6B35;font-family:Arial,sans-serif;word-break:break-all;}
  .footer{margin-top:24px;font-size:11px;color:#ccc;font-family:Arial,sans-serif;}
</style>
</head>
<body>
<div class="cert">
  <p class="brand">Celebrate With Purpose</p>
  <div class="badge">${type === 'donation' ? 'Verified Donation' : 'Verified Delivery'}</div>
  <h1 class="title">Certificate of Appreciation</h1>
  <p class="subtitle">This is to proudly certify that</p>
  <p class="donor">${donorName}</p>
  <p class="detail">is recognized ${detail}</p>
  <p class="detail">to support the residents of</p>
  <p class="ngo">${ngoName}</p>
  <div class="divider"></div>
  <p class="meta">
    Date: ${date}<br/>
    Certificate ID: ${certificateId}<br/>
    Issued by: ${ngoName} via Celebrate With Purpose
  </p>
  <p class="verify">Verify at: ${verifyUrl}</p>
  <p class="footer">Thank you for your kindness and generosity.</p>
</div>
</body>
</html>`;
};

export const issueCertificate = async ({ type, record }) => {
  const certificateId = uuidv4();
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = generateCertificateHtml({
    donorName: record.donorName,
    ngoName: record.ngoName,
    type,
    amount: record.amount,
    itemsDelivered: record.itemsDelivered,
    date,
    certificateId,
  });

  const storedHtml = btoa(unescape(encodeURIComponent(html)));
  const certificateUrl = `data:text/html;base64,${storedHtml}`;

  const collectionName = type === 'donation' ? 'donations' : 'deliveries';
  const docId = type === 'donation' ? record.donationId : record.deliveryId;

  await updateDoc(doc(db, collectionName, docId), {
    certificateId,
    certificateUrl,
    verifiedAt: serverTimestamp(),
  });

  try {
    await notifyCertificateIssued({
      donorUid: record.donorUid,
      ngoName: record.ngoName,
      type,
    });
  } catch (e) {
    console.warn('Certificate notification failed:', e);
  }

  return { certificateId, certificateUrl };
};

export const openCertificate = (certificateUrl) => {
  if (!certificateUrl) return;
  if (certificateUrl.startsWith('data:text/html;base64,')) {
    const base64 = certificateUrl.replace('data:text/html;base64,', '');
    const html = decodeURIComponent(escape(atob(base64)));
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else if (certificateUrl.startsWith('data:text/html;charset=utf-8,')) {
    const html = decodeURIComponent(certificateUrl.replace('data:text/html;charset=utf-8,', ''));
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    window.open(certificateUrl, '_blank');
  }
};