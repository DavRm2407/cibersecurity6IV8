document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        alert('Has hecho clic en ' + button.textContent);
    });
});
