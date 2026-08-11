(function () {
  // TEMPORARY STOREFRONT GUARD.
  // Production eligibility must be enforced by structured Shopify/Tiny data.
  function isLargeLiterValue(value) {
    if (!value) return false;
    var normalized = String(value).toLowerCase().replace(',', '.');
    var matches = normalized.match(/(^|[^a-z])(\d+(?:\.\d+)?)\s*l\b/g);
    if (!matches) return false;

    return matches.some(function (match) {
      var number = match.match(/(\d+(?:\.\d+)?)/);
      return number && Number(number[1]) >= 25;
    });
  }

  function addNotice(target, message) {
    if (!target || target.parentNode.querySelector('.cl-large-variant-notice')) return;
    var notice = document.createElement('div');
    notice.className = 'cl-large-variant-notice';
    notice.textContent = message;
    target.parentNode.insertBefore(notice, target);
  }

  function guardVariantPicker(picker) {
    if (picker.dataset.clLargeLiterGuarded === 'true') return;
    picker.dataset.clLargeLiterGuarded = 'true';

    var hiddenCount = 0;
    var selectableCount = 0;

    picker.querySelectorAll('input[type="radio"]').forEach(function (input) {
      var large = isLargeLiterValue(input.value);
      var label = picker.querySelector('label[for="' + input.id + '"]');
      if (large) {
        hiddenCount += 1;
        input.disabled = true;
        input.checked = false;
        input.classList.add('cl-variant-option-hidden');
        if (label) label.classList.add('cl-variant-option-hidden');
      } else if (!input.disabled) {
        selectableCount += 1;
      }
    });

    picker.querySelectorAll('select').forEach(function (select) {
      var firstAllowed = null;
      Array.from(select.options).forEach(function (option) {
        if (isLargeLiterValue(option.value || option.textContent)) {
          hiddenCount += 1;
          option.disabled = true;
          option.hidden = true;
          option.removeAttribute('selected');
        } else if (!firstAllowed && !option.disabled) {
          firstAllowed = option;
          selectableCount += 1;
        }
      });

      if (select.selectedOptions[0] && select.selectedOptions[0].disabled && firstAllowed) {
        firstAllowed.selected = true;
        firstAllowed.setAttribute('selected', 'selected');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    var firstRadio = picker.querySelector('input[type="radio"]:not(:disabled)');
    var checkedRadio = picker.querySelector('input[type="radio"]:checked:not(:disabled)');
    if (!checkedRadio && firstRadio) {
      firstRadio.checked = true;
      firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (hiddenCount > 0) {
      addNotice(
        picker,
        'Apresentações de 25L ou mais foram ocultadas desta primeira versão da loja. Para volumes maiores, fale com a equipe comercial.'
      );
    }

    if (hiddenCount > 0 && selectableCount === 0) {
      var productInfo = picker.closest('product-info') || document;
      productInfo.querySelectorAll('.product-form__submit, .shopify-payment-button__button').forEach(function (button) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      });
      addNotice(
        picker,
        'Este produto não possui apresentação em litros abaixo de 25L disponível para compra online nesta etapa.'
      );
    }
  }

  function guardCartCheckout() {
    var cartForm = document.getElementById('cart');
    var checkoutButton = document.querySelector('.cart__checkout-button');
    if (!cartForm || !checkoutButton) return;

    var blockedItems = Array.from(document.querySelectorAll('.cart-item')).filter(function (item) {
      return isLargeLiterValue(item.textContent);
    });

    if (!blockedItems.length) return;

    checkoutButton.disabled = true;
    checkoutButton.setAttribute('aria-disabled', 'true');

    var ctas = document.querySelector('.cart__ctas');
    if (ctas && !document.querySelector('.cl-cart-large-variant-warning')) {
      var warning = document.createElement('div');
      warning.className = 'cl-cart-large-variant-warning';
      warning.textContent =
        'O carrinho contém apresentação de 25L ou mais. Remova esse item para finalizar pelo checkout online, ou fale com a equipe comercial para compra assistida.';
      ctas.parentNode.insertBefore(warning, ctas);
    }
  }

  function init() {
    document.querySelectorAll('variant-selects').forEach(guardVariantPicker);
    guardCartCheckout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
