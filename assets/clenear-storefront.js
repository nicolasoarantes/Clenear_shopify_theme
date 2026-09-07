(function () {
  function addNotice(target, message) {
    if (!target || target.parentNode.querySelector('.cl-large-variant-notice')) return;
    var notice = document.createElement('div');
    notice.className = 'cl-large-variant-notice';
    notice.textContent = message;
    target.parentNode.insertBefore(notice, target);
  }

  function guardVariantPicker(picker) {
    if (picker.dataset.clenearEligibilityGuarded === 'true') return;
    picker.dataset.clenearEligibilityGuarded = 'true';

    var blockedCount = 0;
    var selectableCount = 0;

    picker.querySelectorAll('input[type="radio"]').forEach(function (input) {
      var blocked = input.dataset.clenearElegibleLoja === 'false';
      var label = picker.querySelector('label[for="' + input.id + '"]');
      if (blocked) {
        blockedCount += 1;
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
        if (option.dataset.clenearElegibleLoja === 'false') {
          blockedCount += 1;
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

    if (blockedCount > 0) {
      addNotice(
        picker,
        'Algumas apresentacoes nao estao elegiveis para compra online. Para comprar esses volumes, fale com a equipe comercial.'
      );
    }

    if (blockedCount > 0 && selectableCount === 0) {
      var productInfo = picker.closest('product-info') || document;
      productInfo.querySelectorAll('.product-form__submit, .shopify-payment-button__button').forEach(function (button) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      });
      addNotice(picker, 'Este produto nao possui variante elegivel para compra online nesta etapa.');
    }
  }

  function guardCartCheckout() {
    var checkoutButtons = document.querySelectorAll('.cart__checkout-button');
    if (!checkoutButtons.length) return;

    var blockedItems = document.querySelectorAll('.cart-item[data-clenear-elegible-loja="false"]');

    if (!blockedItems.length) return;

    checkoutButtons.forEach(function (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.setAttribute('aria-disabled', 'true');
    });

    document.querySelectorAll('.cart__dynamic-checkout-buttons, .additional-checkout-buttons').forEach(function (buttons) {
      buttons.setAttribute('hidden', '');
    });

    var ctas = document.querySelector('.cart__ctas');
    if (ctas && !ctas.parentNode.querySelector('.cl-cart-large-variant-warning')) {
      var warning = document.createElement('div');
      warning.className = 'cl-cart-large-variant-warning';
      warning.textContent =
        'O carrinho contem uma variante nao elegivel para compra online. Remova esse item para finalizar pelo checkout ou fale com a equipe comercial.';
      ctas.parentNode.insertBefore(warning, ctas);
    }
  }
  var facetTranslations = {
    Availability: 'Disponibilidade',
    Price: 'Preço',
    'Product type': 'Tipo de produto',
    Brand: 'Marca',
    Vendor: 'Marca',
    Size: 'Tamanho',
    Color: 'Cor',
    'In stock': 'Em estoque',
    'Out of stock': 'Esgotado',
    Available: 'Disponível',
    Unavailable: 'Indisponível',
    Featured: 'Destaques',
    'Best selling': 'Mais vendidos',
    Alphabetically: 'Ordem alfabética',
    'Price, low to high': 'Menor preço',
    'Price, high to low': 'Maior preço',
    'Date, old to new': 'Mais antigos',
    'Date, new to old': 'Mais recentes'
  };

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function translateFacetText(root) {
    var scope = root || document;
    var containers = scope.querySelectorAll
      ? scope.querySelectorAll('.facets-container, .facets-wrapper, .mobile-facets')
      : [];

    containers.forEach(function (facetRoot) {
      var walker = document.createTreeWalker(facetRoot, NodeFilter.SHOW_TEXT);
      var textNode;
      while ((textNode = walker.nextNode())) {
        var nextValue = textNode.nodeValue;
        Object.keys(facetTranslations)
          .sort(function (a, b) {
            return b.length - a.length;
          })
          .forEach(function (source) {
            nextValue = nextValue.replace(new RegExp('\\b' + escapeRegExp(source) + '\\b', 'g'), facetTranslations[source]);
          });
        textNode.nodeValue = nextValue;
      }
    });
  }

  function init() {
    document.querySelectorAll('variant-selects').forEach(guardVariantPicker);
    guardCartCheckout();
    translateFacetText(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
  document.addEventListener('facet:updated', init);

  if (window.MutationObserver) {
    var facetObserver = new MutationObserver(function (mutations) {
      if (
        mutations.some(function (mutation) {
          return Array.from(mutation.addedNodes).some(function (node) {
            return node.nodeType === 1 && node.querySelector && node.querySelector('.facets-container, .facets-wrapper');
          });
        })
      ) {
        translateFacetText(document);
      }
    });
    facetObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
