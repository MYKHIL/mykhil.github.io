let pendingMailtoLink = '';

function sendEmail(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const subject = form.querySelector('[name="subject"]').value;
    const message = form.querySelector('[name="message"]').value;

    pendingMailtoLink = `mailto:mykhilcreations@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    
    document.getElementById('guideModal').classList.add('show');
}

function closeGuideModal() {
    document.getElementById('guideModal').classList.remove('show');
    pendingMailtoLink = '';
}

function proceedWithEmail() {
    if (pendingMailtoLink) {
        window.location.href = pendingMailtoLink;
        document.getElementById('commentForm').reset();
        closeGuideModal();
    }
} 