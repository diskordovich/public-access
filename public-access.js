class PublicAccessPlayerSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["public-access", "sheet", "actor", "player-sheet"],
      template: "systems/public-access/templates/player-sheet.hbs",
      width: 740,
      height: 860,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      scrollY: [".sheet-body"]
    });
  }

  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.moves = this.actor.items.filter(i => i.type === "moves");
    context.cornerItems = this.actor.items.filter(i => i.type === "corner_item");
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find(".rollable").click(this._onStatRoll.bind(this));

    html.find(".move-add").click(this._onMoveAdd.bind(this));

    html.find(".corner-add").click(this._onCornerAdd.bind(this));

    html.find(".corner-cross").click(ev => {
      const id = $(ev.currentTarget).closest(".corner-item").data("itemId");
      const item = this.actor.items.get(id);
      item?.update({ "system.crossed": !item.system.crossed });
    });

    html.find(".corner-delete").click(ev => {
      const id = $(ev.currentTarget).closest(".corner-item").data("itemId");
      const item = this.actor.items.get(id);
      item?.delete();
    });

    html.find(".corner-name").change(ev => {
      const id = $(ev.currentTarget).closest(".corner-item").data("itemId");
      const item = this.actor.items.get(id);
      item?.update({ name: ev.currentTarget.value });
    });

    html.find(".item-edit").click(ev => {
      const id = $(ev.currentTarget).closest(".move-item").data("itemId");
      const item = this.actor.items.get(id);
      item?.sheet.render(true);
    });

    html.find(".item-delete").click(ev => {
      const id = $(ev.currentTarget).closest(".move-item").data("itemId");
      const item = this.actor.items.get(id);
      item?.delete();
    });
  }

  async _onCornerAdd(event) {
    event.preventDefault();
    await this.actor.createEmbeddedDocuments("Item", [{
      name: "Новый предмет",
      type: "corner_item"
    }]);
  }

  async _onMoveAdd(event) {
    event.preventDefault();
    const created = await this.actor.createEmbeddedDocuments("Item", [{
      name: "Новый ход",
      type: "moves"
    }]);
    created[0]?.sheet.render(true);
  }

  async _onStatRoll(event) {
    event.preventDefault();
    const stat = event.currentTarget.dataset.stat;
    const label = event.currentTarget.dataset.label;
    const value = this.actor.system.stats[stat];

    let formula, mode;
    if (event.shiftKey) {
      formula = `3d6kh2 + ${value}`;
      mode = " (преимущество)";
    } else if (event.ctrlKey) {
      formula = `3d6kl2 + ${value}`;
      mode = " (помеха)";
    } else {
      formula = `2d6 + ${value}`;
      mode = "";
    }

    const roll = new Roll(formula);
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${label}${mode}`
    });
  }
}

class PublicAccessMoveSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["public-access", "sheet", "item", "move-sheet"],
      template: "systems/public-access/templates/move-sheet.hbs",
      width: 420,
      height: 360
    });
  }

  getData() {
    const context = super.getData();
    const itemData = this.item.toObject(false);
    context.system = itemData.system;
    context.flags = itemData.flags;
    return context;
  }
}

Hooks.once("init", () => {
  Actors.registerSheet("public-access", PublicAccessPlayerSheet, {
    types: ["player"],
    makeDefault: true,
    label: "Public Access Player Sheet"
  });

  Items.registerSheet("public-access", PublicAccessMoveSheet, {
    types: ["moves"],
    makeDefault: true,
    label: "Public Access Move Sheet"
  });
});