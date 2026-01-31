export function calculateAge(dateOfBirth: string): string {
    if (!dateOfBirth) return '';

    // Parse 'DD.MM.YYYY' or 'YYYY-MM-DD'
    let birthDate: Date;
    if (dateOfBirth.includes('.')) {
        const parts = dateOfBirth.split('.');
        birthDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
        birthDate = new Date(dateOfBirth); // fallback
    }

    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }

    // Adjust months if day hasn't occurred yet in current month
    if (today.getDate() < birthDate.getDate()) {
        months--;
        if (months < 0) {
            months += 12;
            // years already decremented above if needed
        }
    }

    if (years === 0) {
        if (months <= 1) return `${months} Monat`;
        return `${months} Monate`;
    }

    if (months === 0) {
        if (years === 1) return `${years} Jahr`;
        return `${years} Jahre`;
    }

    return `${years} J, ${months} M`;
}
