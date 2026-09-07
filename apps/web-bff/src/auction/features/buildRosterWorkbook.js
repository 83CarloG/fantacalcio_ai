"use strict";
const ExcelJS = require("exceljs");
const getAuctionState = require("../jobs/getAuctionState");

const ROLE_ORDER = ["P", "D", "C", "A"];

/**
 * The exportable roster recap (D.5): one sheet per manager (their real picks, price,
 * running total) plus a "Riepilogo" sheet with every manager's spend/residual/slots side
 * by side — a checkable record of the whole draft, not just what's on screen. Pure data
 * formatting (ExcelJS is a document library, not a web framework) — the route turns the
 * returned Buffer into an HTTP response.
 */
module.exports = async function buildRosterWorkbook(season) {
    const state = await getAuctionState(season);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Fanta Luminous";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Riepilogo");
    summarySheet.columns = [
        {header: "Manager", key: "name", width: 20},
        {header: "Budget", key: "budgetTotal", width: 10},
        {header: "Speso", key: "spent", width: 10},
        {header: "Residuo", key: "remaining", width: 10},
        {header: "P", key: "P", width: 8},
        {header: "D", key: "D", width: 8},
        {header: "C", key: "C", width: 8},
        {header: "A", key: "A", width: 8}
    ];
    summarySheet.getRow(1).font = {bold: true};
    for (const manager of state.managers) {
        summarySheet.addRow({
            name: manager.name + (manager.isOwner ? " (io)" : ""),
            budgetTotal: manager.budgetTotal,
            spent: manager.spent,
            remaining: manager.remaining,
            P: `${manager.slotsByRole.P}/${manager.slotsTarget.P}`,
            D: `${manager.slotsByRole.D}/${manager.slotsTarget.D}`,
            C: `${manager.slotsByRole.C}/${manager.slotsTarget.C}`,
            A: `${manager.slotsByRole.A}/${manager.slotsTarget.A}`
        });
    }

    for (const manager of state.managers) {
        // Excel sheet names cap at 31 chars and forbid : \ / ? * [ ]
        const sheetName = manager.name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || `Manager ${manager.id}`;
        const sheet = workbook.addWorksheet(sheetName);
        sheet.columns = [
            {header: "Giocatore", key: "playerName", width: 24},
            {header: "Squadra", key: "playerTeam", width: 16},
            {header: "Ruolo", key: "playerRole", width: 8},
            {header: "Prezzo", key: "price", width: 10}
        ];
        sheet.getRow(1).font = {bold: true};
        const picks = state.picks
            .filter((pick) => pick.managerId === manager.id)
            .sort((a, b) => ROLE_ORDER.indexOf(a.playerRole) - ROLE_ORDER.indexOf(b.playerRole) || a.playerName.localeCompare(b.playerName));
        for (const pick of picks) sheet.addRow({playerName: pick.playerName, playerTeam: pick.playerTeam, playerRole: pick.playerRole, price: pick.price});
        sheet.addRow({});
        sheet.addRow({playerName: "Totale", price: picks.reduce((sum, pick) => sum + pick.price, 0)}).font = {bold: true};
    }

    return workbook.xlsx.writeBuffer();
};
