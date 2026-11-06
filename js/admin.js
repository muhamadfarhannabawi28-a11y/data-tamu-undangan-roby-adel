
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
// Tidak menggunakan created_at
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

    // Total jumlah tamu
    $("totalGuests").textContent = fmt(guests.length);

    // Total nominal uang
    $("totalNominal").textContent = money(
        guests.reduce((s, g) => s + Number(g.nominal || 0), 0)
    );

    // Total beras
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
// Tidak menggunakan updated_at
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

    // Validasi data
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
        // Edit data
        result = await window.db
            .from("tamu_undangan")
            .update(payload)
            .eq("id", id);
    } else {
        // Tambah data
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

    // Tombol EDIT
    const editButton = e.target.closest("[data-edit]");

    // Tombol HAPUS
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
