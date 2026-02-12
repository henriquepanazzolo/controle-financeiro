'use client';

import { useState, useCallback } from 'react';
import { createAccount, updateAccount, toggleAccountStatus, deleteAccount } from '@/actions/accounts';
import type { Account } from '@/generated/prisma/client';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './Accounts.module.css';

interface Props {
    accounts: Account[];
}

export default function AccountsClient({ accounts }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [icon, setIcon] = useState('🏦');

    // Create Handler
    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await createAccount(fd);

        if (res.success) {
            setIsCreateOpen(false);
            setIcon('🏦');
            // Optional: Show success toast
        } else {
            alert(res.error || 'Erro ao criar conta');
        }
    }, []);

    // Edit Handler
    const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await updateAccount(fd);
        setEditingAccount(null);
    }, []);

    const handleEditClick = (acc: Account) => {
        setEditingAccount(acc);
        setIcon(acc.icon || '🏦');
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) return;
        const fd = new FormData();
        fd.set('accountId', accountId);
        const res = await deleteAccount(fd);
        if (!res.success) alert(res.error);
    };

    const handleToggle = async (accountId: string) => {
        const fd = new FormData();
        fd.set('accountId', accountId);
        await toggleAccountStatus(fd);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Minhas Contas</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas contas bancárias e carteiras</p>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="btn btn--primary">
                    + Nova Conta
                </button>
            </div>

            <div className={styles.grid}>
                {accounts.map((acc) => (
                    <div key={acc.id} className={`${styles.card} ${!acc.isActive ? styles.inactive : ''}`} style={{ borderColor: acc.isActive ? acc.color || 'var(--border)' : 'var(--border)' }}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon} style={{ background: acc.color ? `${acc.color}20` : 'var(--surface-hover)', color: acc.color ?? 'var(--text-primary)' }}>
                                {acc.icon || '🏦'}
                            </div>
                            <div className={styles.cardActions}>
                                <button onClick={() => handleToggle(acc.id)} className="btn btn--ghost btn--sm" title={acc.isActive ? 'Desativar' : 'Ativar'}>
                                    {acc.isActive ? '👁️' : '🚫'}
                                </button>
                                <button onClick={() => handleEditClick(acc)} className="btn btn--ghost btn--sm" title="Editar">
                                    ✏️
                                </button>
                                <button onClick={() => handleDelete(acc.id)} className="btn btn--ghost btn--sm" title="Excluir" style={{ color: 'var(--danger)' }}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className={styles.cardName}>{acc.name}</h3>
                            <div className={styles.cardType}>
                                {ACCOUNT_TYPES[acc.type] || acc.type}
                            </div>
                            <div className={styles.cardBalance}>
                                {formatCurrency(Number(acc.balance))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Nova Conta</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="btn btn--ghost">✕</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label>Nome da Conta</label>
                                <input name="name" className="input" placeholder="Ex: Nubank, Carteira..." required />
                            </div>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label>Tipo</label>
                                    <select name="type" className="input" required>
                                        <option value="CHECKING">Conta Corrente</option>
                                        <option value="SAVINGS">Poupança</option>
                                        <option value="CREDIT_CARD">Cartão de Crédito</option>
                                        <option value="INVESTMENT">Investimento</option>
                                        <option value="CASH">Dinheiro Físico</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Saldo Inicial</label>
                                    <input name="balance" type="number" step="0.01" className="input" defaultValue="0" required />
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label>Ícone</label>
                                    <input type="hidden" name="icon" value={icon} />
                                    <EmojiPicker value={icon} onChange={setIcon} />
                                </div>
                                <div className="input-group">
                                    <label>Cor</label>
                                    <input name="color" type="color" className="input" defaultValue="#3B82F6" style={{ height: '42px' }} />
                                </div>
                            </div>

                            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>Criar Conta</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingAccount && (
                <div className="overlay" onClick={() => setEditingAccount(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Editar Conta</h2>
                            <button onClick={() => setEditingAccount(null)} className="btn btn--ghost">✕</button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <input type="hidden" name="id" value={editingAccount.id} />
                            <input type="hidden" name="isActive" value={String(editingAccount.isActive)} />

                            <div className="input-group">
                                <label>Nome da Conta</label>
                                <input name="name" className="input" defaultValue={editingAccount.name} required />
                            </div>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label>Tipo</label>
                                    <select name="type" className="input" defaultValue={editingAccount.type} required>
                                        <option value="CHECKING">Conta Corrente</option>
                                        <option value="SAVINGS">Poupança</option>
                                        <option value="CREDIT_CARD">Cartão de Crédito</option>
                                        <option value="INVESTMENT">Investimento</option>
                                        <option value="CASH">Dinheiro Físico</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Saldo Atual</label>
                                    <input name="balance" type="number" step="0.01" className="input" defaultValue={Number(editingAccount.balance)} required />
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label>Ícone</label>
                                    <input type="hidden" name="icon" value={icon} />
                                    <EmojiPicker value={icon} onChange={setIcon} />
                                </div>
                                <div className="input-group">
                                    <label>Cor</label>
                                    <input name="color" type="color" className="input" defaultValue={editingAccount.color || '#3B82F6'} style={{ height: '42px' }} />
                                </div>
                            </div>

                            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>Salvar Alterações</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const ACCOUNT_TYPES: Record<string, string> = {
    CHECKING: 'Conta Corrente',
    SAVINGS: 'Poupança',
    CREDIT_CARD: 'Cartão de Crédito',
    INVESTMENT: 'Investimento',
    CASH: 'Carteira / Dinheiro',
};
