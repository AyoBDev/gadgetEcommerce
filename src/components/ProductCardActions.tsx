'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useStore } from '@/components/StoreProvider';

/**
 * The wishlist + compare toggle overlay shown on a product card image.
 * Kept as its own client component so the card itself can stay a Server
 * Component that only reads Payload data.
 */
export function ProductCardActions({ laptopId }: { laptopId: number }) {
  const { isInWishlist, toggleWishlist, isInCompare, toggleCompare, compare, compareMax } = useStore();
  const inWishlist = isInWishlist(laptopId);
  const inCompare = isInCompare(laptopId);
  const compareFull = !inCompare && compare.length >= compareMax;

  const btnSx = {
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    zIndex: 2,
    '&:hover': { bgcolor: 'background.paper' },
  } as const;

  return (
    <>
      <Tooltip title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
        <IconButton
          size="small"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() => toggleWishlist(laptopId)}
          sx={{ position: 'absolute', bottom: 8, right: 8, color: inWishlist ? 'error.main' : 'text.secondary', ...btnSx }}
        >
          {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={compareFull ? 'Compare list is full' : inCompare ? 'Remove from compare' : 'Add to compare'}>
        <span style={{ position: 'absolute', bottom: 8, right: 48, zIndex: 2 }}>
          <IconButton
            size="small"
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
            disabled={compareFull}
            onClick={() => toggleCompare(laptopId)}
            sx={{ color: inCompare ? 'primary.main' : 'text.secondary', ...btnSx }}
          >
            <CompareArrowsIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
