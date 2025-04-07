import nodemailer from 'nodemailer';

// Nodemailer transporter yapılandırması
let transporter;

// Mail gönderme servisi başlatma
const initializeMailer = (emailConfig) => {
  // GMail transporter oluşturma
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailConfig.email,
      pass: emailConfig.password // Gmail'de "uygulama şifresi" kullanılmalı
    }
  });
  
  // Test e-postası gönder (opsiyonel)
  if (emailConfig.testEmail) {
    testConnection();
  }
  
  console.log('E-posta servisi başlatıldı');
  return transporter;
};

// Bağlantı testini gerçekleştir
const testConnection = async () => {
  try {
    await transporter.verify();
    console.log('E-posta sunucusu bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('E-posta sunucusu bağlantı hatası:', error);
    return false;
  }
};

// Bildirim e-postası gönderme
const sendNotificationEmail = async (notification, adminUsers) => {
  try {
    if (!transporter) {
      console.error('E-posta servisi başlatılmamış');
      return false;
    }
    
    // Alıcı e-posta adresleri
    const to = adminUsers.map(user => user.email).join(', ');
    
    if (!to) {
      console.error('Alıcı e-posta adresi bulunamadı');
      return false;
    }
    
    // E-posta özellikleri
    const mailOptions = {
      from: process.env.EMAIL_FROM || transporter.options.auth.user,
      to,
      subject: `Bildirim: ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">${notification.title}</h2>
          <p style="font-size: 16px; color: #666;">${notification.message}</p>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">
            Bu e-posta otomatik olarak Tadu SatisTakip sisteminden gönderilmiştir.
          </p>
        </div>
      `
    };
    
    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    console.log('Bildirim e-postası gönderildi:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return false;
  }
};

// Satış e-postası gönderme
const sendSaleEmail = async (sale, block, customer, user, adminUsers, isCancellation = false) => {
  try {
    if (!transporter) {
      console.error('E-posta servisi başlatılmamış');
      return false;
    }
    
    // Alıcı e-posta adresleri
    const to = adminUsers.map(user => user.email).join(', ');
    
    if (!to) {
      console.error('Alıcı e-posta adresi bulunamadı');
      return false;
    }
    
    // Müşteri bilgisi
    const customerName = customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Bilinmeyen Müşteri';
    
    // İşlem türüne göre konu ve içerik belirleme
    let subject, content;
    
    if (isCancellation) {
      subject = `Satış İptal Bildirimi: ${block.unitNumber || 'Bilinmeyen Birim'}`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #d32f2f;">Satış İptal Bildirimi</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Proje:</strong> ${block.projectName || 'Belirtilmemiş'}</p>
            <p><strong>Birim No:</strong> ${block.unitNumber || 'Belirtilmemiş'}</p>
            <p><strong>İptal Edilen Müşteri:</strong> ${customerName}</p>
            <p><strong>İptal Eden Kullanıcı:</strong> ${user?.fullName || user?.name || 'Bilinmeyen Kullanıcı'}</p>
            <p><strong>İptal Tarihi:</strong> ${new Date(sale.cancellationDetails?.cancelledAt || Date.now()).toLocaleString('tr-TR')}</p>
            <p><strong>İptal Nedeni:</strong> ${sale.cancellationDetails?.reason || 'Belirtilmemiş'}</p>
            <p><strong>Satış Tutarı:</strong> ${sale.totalAmount?.toLocaleString('tr-TR')} TL</p>
            ${sale.cancellationDetails?.hasRefund ? `
              <p><strong>İade Tutarı:</strong> ${sale.cancellationDetails.refundAmount?.toLocaleString('tr-TR')} TL</p>
              <p><strong>İade Tarihi:</strong> ${sale.cancellationDetails.refundDate ? new Date(sale.cancellationDetails.refundDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}</p>
            ` : '<p><strong>İade:</strong> İade yapılmadı</p>'}
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">
            Bu e-posta otomatik olarak Tadu SatisTakip sisteminden gönderilmiştir.
          </p>
        </div>
      `;
    } else {
      subject = `Yeni Satış Bildirimi: ${block.unitNumber || 'Bilinmeyen Birim'}`;
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4caf50;">Yeni Satış Bildirimi</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Proje:</strong> ${block.projectName || 'Belirtilmemiş'}</p>
            <p><strong>Birim No:</strong> ${block.unitNumber || 'Belirtilmemiş'}</p>
            <p><strong>Müşteri:</strong> ${customerName}</p>
            <p><strong>Satışı Yapan:</strong> ${user?.fullName || user?.name || 'Bilinmeyen Kullanıcı'}</p>
            <p><strong>Satış Tarihi:</strong> ${new Date(sale.createdAt || Date.now()).toLocaleString('tr-TR')}</p>
            <p><strong>Satış Tutarı:</strong> ${sale.totalAmount?.toLocaleString('tr-TR')} TL</p>
            <p><strong>Ödeme Yöntemi:</strong> ${(() => {
              switch(sale.paymentPlan) {
                case 'cash': return 'Peşin';
                case 'cash-installment': return 'Peşin + Taksit';
                case 'installment': return 'Taksit';
                case 'balloon-payment': return 'Balon Ödemeli';
                default: return 'Belirtilmemiş';
              }
            })()}</p>
            <p><strong>Ödeme Planı:</strong> ${sale.installmentCount || 1} Taksit</p>
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">
            Bu e-posta otomatik olarak Tadu SatisTakip sisteminden gönderilmiştir.
          </p>
        </div>
      `;
    }
    
    // E-posta özellikleri
    const mailOptions = {
      from: process.env.EMAIL_FROM || transporter.options.auth.user,
      to,
      subject,
      html: content
    };
    
    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    console.log(`${isCancellation ? 'İptal' : 'Satış'} e-postası gönderildi:`, info.messageId);
    
    return true;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return false;
  }
};

export { 
  initializeMailer, 
  sendNotificationEmail, 
  sendSaleEmail 
};
