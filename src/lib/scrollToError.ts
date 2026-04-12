/** Scroll to the first visible .field-error element after validation */
export const scrollToFirstError = () => {
  setTimeout(() => {
    const el = document.querySelector('.field-error');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
};
