(function () {
  const binding = new Shiny.InputBinding();
  $.extend(binding, {
    find: (scope) => $(scope).find('.e2efixture-counter'),
    getValue: (el) => Number(el.dataset.count || 0),
    getType: () => 'e2efixture.counter',
    subscribe: (el, callback) => {
      $(el).on('click.e2efixture', () => {
        el.dataset.count = String(Number(el.dataset.count || 0) + 1);
        callback();
      });
    },
    unsubscribe: (el) => $(el).off('.e2efixture'),
  });
  Shiny.inputBindings.register(binding, 'e2efixture.counter');
})();
