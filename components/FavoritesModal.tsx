
import React from 'react';
import { Modal } from './Modal.tsx';
import type { Favorite } from '../types.ts';
import { StarIcon } from './Icons.tsx';
import { useI18n } from '../contexts/I18nContext.tsx';

interface FavoritesModalProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: Favorite[];
    onFavoriteClick: (favorite: Favorite) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose, favorites, onFavoriteClick }) => {
    const { t } = useI18n();
    
    const groupedFavorites = favorites.reduce((acc, fav) => {
        (acc[fav.civilizationName] = acc[fav.civilizationName] || []).push(fav);
        return acc;
    }, {} as Record<string, Favorite[]>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="flex items-center gap-4 mb-4">
                <StarIcon className="w-8 h-8 text-[var(--color-accent)]" filled />
                <h2 className="text-2xl font-bold font-heading" style={{color: 'var(--color-accent)'}}>{t('modals.favoritesTitle')}</h2>
            </div>

            {favorites.length === 0 ? (
                <p className="text-center text-[var(--color-secondary)] py-8">{t('modals.noFavorites')}</p>
            ) : (
                <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(groupedFavorites).map(([civName, favs]) => (
                        <div key={civName}>
                            <h4 className="font-bold text-[var(--color-foreground)] mb-2 sticky top-0 bg-[var(--color-background)] py-1">{civName}</h4>
                            <ul className="space-y-2 pl-2 border-l-2" style={{borderColor: 'var(--color-primary)'}}>
                                {favs.map((fav) => (
                                    <li key={`${fav.type}-${fav.id}`}>
                                        <button 
                                            onClick={() => onFavoriteClick(fav)}
                                            className="w-full text-left p-2 rounded-md text-[var(--color-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors duration-200"
                                        >
                                            {fav.name}
                                            <span className="text-xs opacity-60 ml-2 capitalize">({fav.type})</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};
