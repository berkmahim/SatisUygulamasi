// Para birimini formatla
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
};

// Tarihi formatla
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
};

// Kısa tarih formatı
export const formatShortDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
};

// Telefon numarası formatı
export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + ' ' + match[3];
    }
    return phoneNumber;
};

// TC Kimlik formatı
export const formatTcNo = (tcNo) => {
    if (!tcNo) return '';
    const cleaned = tcNo.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{5})/, '$1 $2 $3');
    }
    return tcNo;
};

// Para birimi sembolsüz format
export const formatNumber = (number) => {
    return new Intl.NumberFormat('tr-TR').format(number);
};
