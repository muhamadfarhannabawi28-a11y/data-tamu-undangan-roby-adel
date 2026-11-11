
const $ = id => document.getElementById(id);

const money = v =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(v || 0));

const fmt = v =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 1
    }).format(Number(v || 0));

const esc = v =>
    String(v ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

let guests = [];

// ========================================
// PESAN NOTIFIKASI
// ========================================

function msg(t, ok = false) {
    $("formMessage").textContent = t;
    $("formMessage").className = "message " + (ok ? "success" : "");
}

// ========================================
// PEMERIKSAAN LOGIN ADMIN
// ========================================

async function guard() {
    if (!window.db) {
        location.href = "login.html";
        return false;
    }

    const {
        data: { session },
        error
    } = await window.db.auth.getSession();

    if (error || !session) {
        location.href = "login.html";
        return false;
    }

    if (session.user.id !== window.ADMIN_UID) {
        await window.db.auth.signOut();
        location.href = "login.html";
        return false;
    }

    return true;
}

// ========================================
// MEMUAT DATA TAMU
// ========================================

async function load() {
    const { data, error } = await window.db
        .from("tamu_undangan")
        .select("*");

    if (error) {
        msg("Gagal memuat data: " + error.message);
        return;
    }

    guests = data || [];

    $("totalGuests").textContent = fmt(guests.length);

    $("totalNominal").textContent = money(
        guests.reduce((s, g) => s + Number(g.nominal || 0), 0)
    );

    $("totalRice").textContent =
        fmt(guests.reduce((s, g) => s + Number(g.beras_liter || 0), 0)) + " L";

    render();
}

// ========================================
// MENAMPILKAN DATA TAMU
// ========================================

function render() {
    const q = $("searchInput").value.toLowerCase();

    const filtered = guests.filter(g =>
        (g.nama + " " + g.alamat).toLowerCase().includes(q)
    );

    $("recordCount").textContent = filtered.length + " data";

    $("guestRows").innerHTML = filtered.length
        ? filtered.map((g, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><b>${esc(g.nama)}</b></td>
                <td>${esc(g.alamat)}</td>
                <td>${money(g.nominal)}</td>
                <td>${g.beras_liter == null ? "—" : fmt(g.beras_liter) + " L"}</td>
                <td>
                    <button class="outline small" data-edit="${g.id}">
                        Edit
                    </button>

                    <button class="danger small" data-del="${g.id}">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="6">Belum ada data.</td></tr>';
}

// ========================================
// RESET FORM
// ========================================

function reset() {
    $("guestForm").reset();

    $("guestId").value = "";
    $("formTitle").textContent = "Tambah Tamu";
    $("saveButton").textContent = "Simpan Data";
    $("cancelEdit").hidden = true;

    msg("");
}

// ========================================
// TAMBAH DAN EDIT DATA TAMU
// ========================================

$("guestForm").addEventListener("submit", async e => {
    e.preventDefault();

    const id = $("guestId").value;

    const payload = {
        nama: $("guestName").value.trim(),
        alamat: $("guestAddress").value.trim(),
        nominal: Number($("guestNominal").value),
        beras_liter: $("guestRice").value === ""
            ? null
            : Number($("guestRice").value)
    };

    if (
        !payload.nama ||
        !payload.alamat ||
        !Number.isFinite(payload.nominal) ||
        payload.nominal < 0 ||
        (
            payload.beras_liter !== null &&
            (
                !Number.isFinite(payload.beras_liter) ||
                payload.beras_liter < 0
            )
        )
    ) {
        msg("Periksa kembali isian data.");
        return;
    }

    $("saveButton").disabled = true;

    let result;

    if (id) {
        result = await window.db
            .from("tamu_undangan")
            .update(payload)
            .eq("id", id);
    } else {
        result = await window.db
            .from("tamu_undangan")
            .insert(payload);
    }

    $("saveButton").disabled = false;

    if (result.error) {
        msg("Gagal menyimpan: " + result.error.message);
        return;
    }

    reset();

    msg(
        id ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.",
        true
    );

    await load();
});

// ========================================
// EDIT DAN HAPUS DATA
// ========================================

$("guestRows").addEventListener("click", async e => {

    const editButton = e.target.closest("[data-edit]");
    const deleteButton = e.target.closest("[data-del]");

    if (editButton) {
        const guest = guests.find(
            g => g.id === editButton.dataset.edit
        );

        if (!guest) return;

        $("guestId").value = guest.id;
        $("guestName").value = guest.nama;
        $("guestAddress").value = guest.alamat;
        $("guestNominal").value = guest.nominal;
        $("guestRice").value = guest.beras_liter ?? "";

        $("formTitle").textContent = "Edit Data Tamu";
        $("saveButton").textContent = "Simpan Perubahan";
        $("cancelEdit").hidden = false;

        scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    if (deleteButton) {
        const guest = guests.find(
            g => g.id === deleteButton.dataset.del
        );

        if (!guest) return;

        if (confirm("Hapus data " + guest.nama + "?")) {

            const { error } = await window.db
                .from("tamu_undangan")
                .delete()
                .eq("id", guest.id);

            if (error) {
                alert("Gagal menghapus: " + error.message);
            } else {
                alert("Data berhasil dihapus.");
                await load();
            }
        }
    }
});

// ========================================
// DOWNLOAD DATA TAMU DALAM FORMAT PDF
// ========================================

async function downloadPDF() {

    const button = $("downloadPDF");

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Library PDF belum berhasil dimuat. Periksa koneksi internet lalu muat ulang halaman.");
        return;
    }

    button.disabled = true;
    button.textContent = "Menyiapkan PDF...";

    try {

        // Ambil seluruh data terbaru dari Supabase
        const { data, error } = await window.db
            .from("tamu_undangan")
            .select("*");

        if (error) {
            throw new Error(error.message);
        }

        const allGuests = data || [];

        if (allGuests.length === 0) {
            alert("Belum ada data tamu untuk diunduh.");
            return;
        }

        // Membuat dokumen PDF A4
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        // Judul dokumen
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);

        doc.text(
            "DATA TAMU UNDANGAN",
            148.5,
            18,
            { align: "center" }
        );

        doc.setFontSize(15);

        doc.text(
            "ROBY & ADEL",
            148.5,
            26,
            { align: "center" }
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.text(
            "Daftar Data Tamu Pernikahan",
            148.5,
            33,
            { align: "center" }
        );

        // Garis pemisah
        doc.setDrawColor(190, 160, 110);
        doc.line(14, 38, 283, 38);

        // Menyiapkan isi tabel
        const rows = allGuests.map((g, i) => [
            i + 1,
            g.nama || "-",
            g.alamat || "-",
            money(g.nominal),
            g.beras_liter == null
                ? "-"
                : fmt(g.beras_liter) + " Liter"
        ]);

        // Membuat tabel otomatis
        doc.autoTable({
            startY: 44,

            head: [[
                "No.",
                "Nama Tamu",
                "Alamat",
                "Nominal",
                "Beras"
            ]],

            body: rows,

            theme: "grid",

            styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 3,
                valign: "middle",
                overflow: "linebreak"
            },

            headStyles: {
                fillColor: [139, 111, 71],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center"
            },

            columnStyles: {
                0: { cellWidth: 15, halign: "center" },
                1: { cellWidth: 55 },
                2: { cellWidth: 105 },
                3: { cellWidth: 55, halign: "right" },
                4: { cellWidth: 35, halign: "center" }
            },

            alternateRowStyles: {
                fillColor: [250, 247, 241]
            },

            margin: {
                left: 14,
                right: 14,
                bottom: 25
            },

            didDrawPage: function () {
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");

                doc.text(
                    "Roby & Adel - Data Tamu Undangan",
                    14,
                    pageHeight - 10
                );

                doc.text(
                    "Halaman " + doc.internal.getNumberOfPages(),
                    pageWidth - 14,
                    pageHeight - 10,
                    { align: "right" }
                );
            }
        });

        // Menghitung total
        const totalGuests = allGuests.length;

        const totalNominal = allGuests.reduce(
            (s, g) => s + Number(g.nominal || 0),
            0
        );

        const totalRice = allGuests.reduce(
            (s, g) => s + Number(g.beras_liter || 0),
            0
        );

        // Ringkasan di bawah tabel
        let finalY = doc.lastAutoTable.finalY + 10;

        // Jika ringkasan tidak muat, buat halaman baru
        if (finalY > 175) {
            doc.addPage();
            finalY = 20;
        }

        doc.setDrawColor(190, 160, 110);
        doc.line(14, finalY, 283, finalY);

        finalY += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        doc.text("RINGKASAN DATA", 14, finalY);

        finalY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(
            "Total Tamu: " + fmt(totalGuests),
            14,
            finalY
        );

        doc.text(
            "Total Nominal: " + money(totalNominal),
            100,
            finalY
        );

        doc.text(
            "Total Beras: " + fmt(totalRice) + " Liter",
            210,
            finalY
        );

        // Unduh PDF
        doc.save("Data-Tamu-Roby-Adel.pdf");

    } catch (error) {

        alert("Gagal membuat PDF: " + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "↓ Download PDF";

    }
}

// ========================================
// TOMBOL DOWNLOAD PDF
// ========================================

$("downloadPDF").addEventListener("click", downloadPDF);

// ========================================
// TOMBOL BATAL EDIT
// ========================================

$("cancelEdit").addEventListener("click", reset);

// ========================================
// PENCARIAN DATA
// ========================================

$("searchInput").addEventListener("input", render);

// ========================================
// LOGOUT ADMIN
// ========================================

$("logoutButton").addEventListener("click", async () => {
    await window.db.auth.signOut();
    location.href = "login.html";
});

// ========================================
// JALANKAN DASHBOARD
// ========================================

(async () => {
    if (await guard()) {
        await load();
    }
})();
