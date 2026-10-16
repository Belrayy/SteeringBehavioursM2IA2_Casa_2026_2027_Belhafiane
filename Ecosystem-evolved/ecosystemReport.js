const EcosystemReport = (() => {
  const SPECIES = Object.freeze({
    wolf: { maxHealth: 3, label: 'Wolves' },
    sheep: { maxHealth: 4, label: 'Sheep' },
  });

  function mean(items, valueOf) {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + valueOf(item), 0) / items.length;
  }

  function countWhere(items, predicate) {
    return items.filter(predicate).length;
  }

  function meanTraits(items, names) {
    const result = {};
    for (const name of names) {
      result[name] = mean(items, (item) => item.gene[name]);
    }
    return result;
  }

  function createReport(sim, settings, generatedAt = new Date()) {
    const plants = sim.plants;
    const sheep = sim.sheep;
    const wolves = sim.wolves;
    const sheepResistance = sheep.map((item) => item.gene.toxinResistance);
    const resistantSheep = countWhere(sheep, (item) => item.gene.toxinResistance >= 0.75);
    const safePlants = countWhere(plants, (item) => item.toxicity === 0);
    const poisonousPlants = countWhere(plants, (item) => item.toxicity === 1);
    const lethalPlants = countWhere(plants, (item) => item.toxicity === 2);

    const speciesSummary = (items, type) => ({
      count: items.length,
      averageAge: mean(items, (item) => item.age),
      averageHealth: mean(items, (item) => item.health),
      averageHealthPercent: mean(items, (item) => item.health / SPECIES[type].maxHealth) * 100,
    });

    const toxicFraction = plants.length
      ? (poisonousPlants + lethalPlants) / plants.length
      : 0;
    const averageResistance = sheep.length ? mean(sheep, (item) => item.gene.toxinResistance) : 0;
    const wolfSummary = speciesSummary(wolves, 'wolf');
    const sheepSummary = speciesSummary(sheep, 'sheep');
    const birthEvents = {
      total: sim.births,
      wolves: sim.wolfBirths,
      sheep: sim.sheepBirths,
      plants: sim.plantSpawns,
    };
    const removalEvents = {
      total: sim.deaths,
      animals: sim.animalDeaths,
      plants: sim.plantRemovals,
    };

    return {
      generatedAt: generatedAt.toISOString(),
      elapsedSeconds: sim.time,
      isRunning: sim.running,
      settings: {
        initialPlants: settings.initialPlants,
        initialWolves: settings.initialWolves,
        initialSheep: settings.initialSheep,
        plantSpawnRate: settings.plantSpawnRate,
      },
      population: {
        wolves: wolves.length,
        sheep: sheep.length,
        plants: plants.length,
      },
      events: { births: birthEvents, removals: removalEvents },
      plants: {
        safe: safePlants,
        poisonous: poisonousPlants,
        lethal: lethalPlants,
        averageToxicity: plants.length
          ? plants.reduce((sum, plant) => sum + plant.toxicity, 0) / plants.length
          : 0,
        toxicFraction,
        averageAge: mean(plants, (plant) => plant.age),
      },
      wolves: {
        ...wolfSummary,
        traits: meanTraits(wolves, ['pursuit', 'vision', 'chaseBias']),
      },
      sheep: {
        ...sheepSummary,
        traits: meanTraits(sheep, ['threatRadius', 'foodRadius', 'avoidToxicity', 'speed']),
        resistance: {
          average: averageResistance,
          maximum: sheep.length ? Math.max(...sheepResistance) : 0,
          resistantCount: resistantSheep,
          bands: [
            countWhere(sheep, (item) => item.gene.toxinResistance < 0.25),
            countWhere(sheep, (item) => item.gene.toxinResistance >= 0.25 && item.gene.toxinResistance < 0.5),
            countWhere(sheep, (item) => item.gene.toxinResistance >= 0.5 && item.gene.toxinResistance < 0.75),
            resistantSheep,
          ],
        },
      },
      observations: {
        population: wolves.length && sheep.length
          ? `Both animal populations are present: ${wolves.length} wolves and ${sheep.length} sheep.`
          : wolves.length
            ? 'No sheep are currently present, so wolves have no prey in this snapshot.'
            : sheep.length
              ? 'No wolves are currently present; sheep face no current predator pressure.'
              : 'No wolves or sheep are currently present in this snapshot.',
        toxicity: plants.length === 0
          ? 'There are no plants to assess for toxicity.'
          : toxicFraction >= 0.4
            ? `${(toxicFraction * 100).toFixed(0)}% of plants are toxic. This meets the 40% threshold that triggers gradual sheep resistance adaptation.`
            : `${(toxicFraction * 100).toFixed(0)}% of plants are toxic, below the 40% threshold for gradual sheep resistance adaptation.`,
        resistance: sheep.length
          ? `${resistantSheep} of ${sheep.length} sheep (${(resistantSheep / sheep.length * 100).toFixed(0)}%) meet the 0.75 resistance level needed to eat lethal plants.`
          : 'There are no sheep from which to measure toxin resistance.',
      },
    };
  }

  function ascii(text) {
    return String(text)
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function wrap(text, maxCharacters) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (line && `${line} ${word}`.length > maxCharacters) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function createPage() {
    const commands = [];
    let y = 790;

    function text(value, x = 48, size = 10, bold = false, color = [0.14, 0.2, 0.16]) {
      commands.push(`${color[0]} ${color[1]} ${color[2]} rg`);
      commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${ascii(value)}) Tj ET`);
      y -= size + 5;
    }

    function paragraph(value, options = {}) {
      const { x = 48, size = 10, maxCharacters = 88, color } = options;
      for (const line of wrap(value, maxCharacters)) text(line, x, size, false, color);
    }

    // Draw several cells on the SAME baseline, then move down once.
    function row(cells, size = 9, bold = false, color = [0.14, 0.2, 0.16]) {
      for (const [value, x] of cells) {
        commands.push(`${color[0]} ${color[1]} ${color[2]} rg`);
        commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${ascii(value)}) Tj ET`);
      }
      y -= size + 5;
    }

    // Bullet marker sits on the same baseline as the first line of the text.
    function bullet(value, options = {}) {
      const { size = 9, maxCharacters = 86, x = 65 } = options;
      commands.push('0.12 0.35 0.24 rg');
      commands.push(`BT /F2 ${size} Tf 52 ${y} Td (-) Tj ET`);
      paragraph(value, { x, size, maxCharacters });
    }

    function rule(color = '0.25 0.59 0.37', yOffset = 0) {
      commands.push(`${color} RG 48 ${y + yOffset} m 547 ${y + yOffset} l S`);
    }

    function section(title) {
      y -= 5;
      text(title, 48, 14, true, [0.12, 0.35, 0.24]);
      commands.push(`0.72 0.82 0.75 RG 48 ${y + 12} m 547 ${y + 12} l S`);
      y -= 2;
    }

    function bar(value, maxValue, x = 48, width = 300, color = [0.25, 0.59, 0.37]) {
      const barY = y - 3;
      commands.push(`0.9 0.93 0.9 rg ${x} ${barY} ${width} 9 re f`);
      if (maxValue > 0 && value > 0) {
        commands.push(`${color[0]} ${color[1]} ${color[2]} rg ${x} ${barY} ${Math.max(1, width * value / maxValue)} 9 re f`);
      }
      y -= 17;
    }

    function gap(height = 5) {
      y -= height;
    }

    return {
      commands,
      get y() { return y; },
      text,
      paragraph,
      row,
      bullet,
      rule,
      section,
      bar,
      gap,
    };
  }

  function addHeader(page, title, subtitle, report) {
    page.text(title, 48, 24, true, [0.1, 0.3, 0.2]);
    page.text(subtitle, 48, 11, false, [0.34, 0.43, 0.36]);
    page.text(
      `Generated ${report.generatedAt.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')} | Simulation time ${report.elapsedSeconds.toFixed(1)} seconds | ${report.isRunning ? 'Running' : 'Paused'}`,
      48,
      9,
      false,
      [0.34, 0.43, 0.36]
    );
    page.gap(-4);
    page.rule('0.25 0.59 0.37');
    page.gap(10);
  }

  function addFooter(page, pageNumber) {
    page.commands.push('0.78 0.83 0.79 RG 48 38 m 547 38 l S');
    page.commands.push('0.38 0.44 0.4 rg BT /F1 8 Tf 48 23 Td (Ecosystem Evolution | Snapshot report, not a historical timeline) Tj ET');
    page.commands.push(`0.38 0.44 0.4 rg BT /F1 8 Tf 520 23 Td (${pageNumber} / 2) Tj ET`);
  }

  function addPopulationTable(page, report) {
    const columnX = [48, 183, 285, 397, 502];
    page.row([
      ['Group', columnX[0]],
      ['Count', columnX[1]],
      ['Average age', columnX[2]],
      ['Average HP', columnX[3]],
      ['Health', columnX[4]],
    ], 9, true);
    page.rule('0.72 0.82 0.75', 10);
    page.gap(2);
    const rows = [
      ['Wolves', report.wolves.count, report.wolves.averageAge, report.wolves.averageHealth, report.wolves.averageHealthPercent],
      ['Sheep', report.sheep.count, report.sheep.averageAge, report.sheep.averageHealth, report.sheep.averageHealthPercent],
      ['Plants', report.plants.safe + report.plants.poisonous + report.plants.lethal, report.plants.averageAge, null, null],
    ];
    const maxHealth = { Wolves: SPECIES.wolf.maxHealth, Sheep: SPECIES.sheep.maxHealth };
    for (const r of rows) {
      page.row([
        [r[0], columnX[0]],
        [String(r[1]), columnX[1]],
        [`${r[2].toFixed(1)} s`, columnX[2]],
        [r[3] == null ? 'N/A' : `${r[3].toFixed(2)} / ${maxHealth[r[0]]}`, columnX[3]],
        [r[4] == null ? 'N/A' : `${r[4].toFixed(0)}%`, columnX[4]],
      ], 9, false);
      page.gap(1);
    }
    page.gap(3);
    page.paragraph('HP means health points. Animals start with full health; safe food restores sheep health and toxic food can reduce it.', {
      size: 8,
      maxCharacters: 100,
      color: [0.35, 0.42, 0.37],
    });
  }

  function createPdf(report) {
    const first = createPage();
    addHeader(first, 'Ecosystem Evolution', 'Plain-language ecosystem snapshot', report);
    first.section('At a glance');
    first.paragraph(report.observations.population);
    first.paragraph(report.observations.toxicity);
    first.paragraph(report.observations.resistance);

    first.section('Current populations and condition');
    addPopulationTable(first, report);

    first.section('Births and removals since reset');
    first.paragraph(`New events: ${report.events.births.total} total = ${report.events.births.wolves} wolf births + ${report.events.births.sheep} sheep births + ${report.events.births.plants} plant spawns.`, { size: 9, maxCharacters: 100 });
    first.paragraph(`Removed: ${report.events.removals.total} total = ${report.events.removals.animals} animal deaths + ${report.events.removals.plants} plants eaten or replaced.`, { size: 9, maxCharacters: 100 });
    first.paragraph('Animal births happen after feeding when maturity, cooldown, and population-cap rules allow. Plant spawns follow the selected rate.', {
      size: 8,
      maxCharacters: 100,
      color: [0.35, 0.42, 0.37],
    });

    first.section('Plant toxicity');
    const plantTotal = report.population.plants;
    first.text(`Average toxicity: ${report.plants.averageToxicity.toFixed(2)} on a 0-2 scale | Toxic plants: ${(report.plants.toxicFraction * 100).toFixed(0)}%`, 48, 9);
    const plantColors = [
      [0.28, 0.68, 0.35],
      [0.85, 0.59, 0.19],
      [0.72, 0.2, 0.22],
    ];
    const plantTypes = [
      ['Safe', report.plants.safe],
      ['Poisonous', report.plants.poisonous],
      ['Lethal', report.plants.lethal],
    ];
    for (let i = 0; i < plantTypes.length; i++) {
      const [label, count] = plantTypes[i];
      first.text(`${label}: ${count} (${plantTotal ? (count / plantTotal * 100).toFixed(0) : 0}%)`, 48, 9);
      first.bar(count, Math.max(plantTotal, 1), 48, 360, plantColors[i]);
    }
    addFooter(first, 1);

    const second = createPage();
    addHeader(second, 'Traits, settings, and rules', 'How to interpret the current snapshot', report);

    second.section('Sheep toxin resistance');
    second.paragraph(`Average: ${(report.sheep.resistance.average * 100).toFixed(1)}% | Highest: ${(report.sheep.resistance.maximum * 100).toFixed(1)}% | Able to eat lethal plants: ${report.sheep.resistance.resistantCount} of ${report.sheep.count}`, { size: 9, maxCharacters: 100 });
    const bands = [
      ['Low (0-24%)', report.sheep.resistance.bands[0]],
      ['Developing (25-49%)', report.sheep.resistance.bands[1]],
      ['Elevated (50-74%)', report.sheep.resistance.bands[2]],
      ['Lethal-plant threshold (75%+)', report.sheep.resistance.bands[3]],
    ];
    for (const [label, count] of bands) {
      second.text(`${label}: ${count} sheep`, 48, 9);
      second.bar(count, Math.max(report.sheep.count, 1), 48, 300);
    }
    second.paragraph('Resistance is inherited with small mutations. Sheep develop it gradually only while at least 40% of plants are toxic. Resistance reduces poisonous and lethal feeding damage.', {
      size: 9,
      maxCharacters: 98,
    });

    second.section('Average inherited behavior traits');
    const wolfTraits = report.wolves.traits;
    const sheepTraits = report.sheep.traits;
    second.paragraph(`Wolves: pursuit ${wolfTraits.pursuit.toFixed(2)}, vision ${wolfTraits.vision.toFixed(1)}, chase bias ${wolfTraits.chaseBias.toFixed(2)}.`, { size: 9, maxCharacters: 100 });
    second.paragraph(`Sheep: threat radius ${sheepTraits.threatRadius.toFixed(1)}, food radius ${sheepTraits.foodRadius.toFixed(1)}, toxin avoidance ${sheepTraits.avoidToxicity.toFixed(2)}, speed ${sheepTraits.speed.toFixed(2)}.`, { size: 9, maxCharacters: 100 });
    second.paragraph('These are averages for the animals alive now, not fixed settings. Offspring inherit traits with bounded mutations.', {
      size: 8,
      maxCharacters: 98,
      color: [0.35, 0.42, 0.37],
    });

    second.section('Simulation setup');
    second.paragraph(`Initial population settings: ${report.settings.initialPlants} plants, ${report.settings.initialWolves} wolves, ${report.settings.initialSheep} sheep.`, { size: 9, maxCharacters: 100 });
    second.paragraph(`Plant spawn rate: ${report.settings.plantSpawnRate.toFixed(2)} plants per simulated second. Current plant limit: 300.`, { size: 9, maxCharacters: 100 });
    second.paragraph('At the plant limit, a new spawn replaces the oldest plant. Initial population settings take effect when Reset is used.', { size: 9, maxCharacters: 100 });

    second.section('Rules in plain language');
    const rules = [
      'Wolves hunt sheep. A successful hunt restores wolf health. Wolves can reproduce after age 10 seconds, with a 16-second cooldown and a population cap of 12.',
      'Sheep eat safe plants to restore health. Sheep can reproduce after age 1.5 seconds, with a 1-second cooldown and a population cap of 180.',
      'Poisonous plants deal up to 1.4 HP damage; lethal plants deal up to 3.2 HP damage before resistance.',
      'Sheep below 75% resistance avoid lethal plants. No species loses health passively; animals grow with age.',
      'Plants grow until eaten or replaced. New plant toxicity follows the current field average, with small mutations.',
      'Birth and removal totals are cumulative since the last reset. Plant removals include eaten plants and replacements, not just deaths.',
    ];
    for (const rule of rules) {
      second.bullet(rule, { size: 9, maxCharacters: 90, x: 65 });
      second.gap(2);
    }
    second.paragraph('This report captures one moment in the simulation. It does not record earlier population changes.', {
      size: 8,
      maxCharacters: 100,
      color: [0.35, 0.42, 0.37],
    });
    addFooter(second, 2);

    const pages = [first.commands.join('\n'), second.commands.join('\n')];
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [4 0 R 6 0 R] /Count 2 >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 8 0 R >> >> /Contents 5 0 R >>',
      `<< /Length ${pages[0].length} >>\nstream\n${pages[0]}\nendstream`,
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 8 0 R >> >> /Contents 7 0 R >>',
      `<< /Length ${pages[1].length} >>\nstream\n${pages[1]}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      '<< /Title (Ecosystem Evolution Report) /Author (Ecosystem Evolution) >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R /Info 9 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  return Object.freeze({ createReport, createPdf });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcosystemReport;
}
