/**
 * ETUNI Frontend Utilities
 * Toast notifications, theme toggle, and common helpers
 */

// ===== TOAST NOTIFICATIONS =====
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="Toast.close(this.parentElement)">&times;</button>
        `;

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.close(toast), duration);
        }

        return toast;
    },

    close(toast) {
        if (toast && toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    },

    success(message, duration) { return this.show(message, 'success', duration); },
    error(message, duration) { return this.show(message, 'error', duration); },
    warning(message, duration) { return this.show(message, 'warning', duration); },
    info(message, duration) { return this.show(message, 'info', duration); }
};

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);


// ===== THEME TOGGLE =====
const Theme = {
    KEY: 'etuni-theme',

    init() {
        const saved = localStorage.getItem(this.KEY);
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        this.updateIcon();
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';

        if (newTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        localStorage.setItem(this.KEY, newTheme);
        this.updateIcon();
    },

    updateIcon() {
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            btn.textContent = isLight ? '🌙' : '☀️';
        }
    }
};


// ===== LOADING STATES =====
const Loading = {
    showButton(btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    },

    hideButton(btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
    },

    showOverlay(message = 'Yükleniyor...') {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner spinner-lg"></div>
                <p>${message}</p>
            `;
            document.body.appendChild(overlay);
        }
    },

    hideOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    skeleton(element, count = 3) {
        element.innerHTML = Array(count).fill(
            '<div class="skeleton skeleton-text"></div>'
        ).join('');
    }
};


// ===== API HELPER =====
const API = {
    async request(url, options = {}) {
        const defaults = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        };

        const config = { ...defaults, ...options };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'Bir hata oluştu',
                    data
                };
            }

            return data;
        } catch (error) {
            if (error.status === 401) {
                Toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
                setTimeout(() => window.location.href = '/login', 2000);
            } else if (error.status === 429) {
                Toast.warning('Çok fazla istek gönderildi. Lütfen bekleyin.');
            } else if (error.message) {
                throw error;
            } else {
                throw { message: 'Bağlantı hatası', original: error };
            }
        }
    },

    get(url) { return this.request(url); },
    post(url, body) { return this.request(url, { method: 'POST', body }); },
    put(url, body) { return this.request(url, { method: 'PUT', body }); },
    delete(url) { return this.request(url, { method: 'DELETE' }); }
};


// ===== TABLE SORTING =====
const TableSort = {
    init(table) {
        const headers = table.querySelectorAll('th.sortable');
        headers.forEach(th => {
            th.addEventListener('click', () => this.sort(table, th));
        });
    },

    sort(table, th) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index = Array.from(th.parentNode.children).indexOf(th);
        const isAsc = th.classList.contains('asc');

        // Reset other headers
        th.parentNode.querySelectorAll('.sortable').forEach(h => {
            h.classList.remove('asc', 'desc');
        });

        th.classList.add(isAsc ? 'desc' : 'asc');

        rows.sort((a, b) => {
            const aVal = a.children[index].textContent.trim();
            const bVal = b.children[index].textContent.trim();

            // Try numeric sort first
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return isAsc ? bNum - aNum : aNum - bNum;
            }

            // String sort
            return isAsc
                ? bVal.localeCompare(aVal, 'tr')
                : aVal.localeCompare(bVal, 'tr');
        });

        rows.forEach(row => tbody.appendChild(row));
    }
};


// ===== FORM VALIDATION =====
const FormValidator = {
    validate(form) {
        let isValid = true;
        const errors = {};

        form.querySelectorAll('[required]').forEach(input => {
            this.clearError(input);

            if (!input.value.trim()) {
                this.showError(input, 'Bu alan zorunludur');
                errors[input.name] = 'Bu alan zorunludur';
                isValid = false;
            }
        });

        form.querySelectorAll('[type="email"]').forEach(input => {
            if (input.value && !this.isEmail(input.value)) {
                this.showError(input, 'Geçerli bir e-posta adresi giriniz');
                errors[input.name] = 'Geçerli bir e-posta adresi giriniz';
                isValid = false;
            }
        });

        return { isValid, errors };
    },

    isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showError(input, message) {
        input.classList.add('error');
        const error = document.createElement('p');
        error.className = 'form-error';
        error.textContent = message;
        input.parentNode.appendChild(error);
    },

    clearError(input) {
        input.classList.remove('error');
        const error = input.parentNode.querySelector('.form-error');
        if (error) error.remove();
    },

    clearAll(form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.form-error').forEach(el => el.remove());
    }
};


// ===== DATE FORMATTING =====
const DateUtils = {
    format(date, format = 'short') {
        const d = new Date(date);
        const options = {
            short: { day: 'numeric', month: 'short' },
            medium: { day: 'numeric', month: 'short', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        };
        return d.toLocaleDateString('tr-TR', options[format] || options.short);
    },

    relative(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = d - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Bugün';
        if (days === 1) return 'Yarın';
        if (days === -1) return 'Dün';
        if (days > 0 && days <= 7) return `${days} gün sonra`;
        if (days < 0 && days >= -7) return `${Math.abs(days)} gün önce`;

        return this.format(date, 'medium');
    }
};


// ===== SCROLL EFFECTS =====
const ScrollEffects = {
    init() {
        // Navbar shrink on scroll
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('nav');
            if (nav) {
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
        });

        // Animate elements on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
};


// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    ScrollEffects.init();

    // Initialize sortable tables
    document.querySelectorAll('.data-table').forEach(table => {
        TableSort.init(table);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Toast, Theme, Loading, API, TableSort, FormValidator, DateUtils };
}
