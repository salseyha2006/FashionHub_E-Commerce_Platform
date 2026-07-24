// backend/src/controllers/banner.controller.js — NEW
const prisma = require('../config/db');

function toBannerDTO(b) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    ctaText: b.ctaText,
    ctaLink: b.ctaLink,
    imageUrl: b.imageUrl,
    gradientFrom: b.gradientFrom,
    gradientTo: b.gradientTo,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
  };
}

// Public — active banners only, ordered for the homepage carousel
async function getActiveBanners(req, res) {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.status(200).json({ success: true, data: banners.map(toBannerDTO) });
  } catch (err) {
    console.error('Get active banners error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
}

// Admin — all banners (active + inactive), for management
async function getAllBannersAdmin(req, res) {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    return res.status(200).json({ success: true, data: banners.map(toBannerDTO) });
  } catch (err) {
    console.error('Get all banners error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
}

async function createBanner(req, res) {
  try {
    const { title, subtitle, ctaText, ctaLink, imageUrl, gradientFrom, gradientTo, isActive } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const maxOrder = await prisma.banner.aggregate({ _max: { sortOrder: true } });
    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle || null,
        ctaText: ctaText || 'Shop now',
        ctaLink: ctaLink || '/shop',
        imageUrl: imageUrl || null,
        gradientFrom: gradientFrom || 'rose',
        gradientTo: gradientTo || 'rose-dark',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    return res.status(201).json({ success: true, data: toBannerDTO(banner) });
  } catch (err) {
    console.error('Create banner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
}

async function updateBanner(req, res) {
  try {
    const { id } = req.params;
    const { title, subtitle, ctaText, ctaLink, imageUrl, gradientFrom, gradientTo, isActive } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(gradientFrom !== undefined && { gradientFrom }),
        ...(gradientTo !== undefined && { gradientTo }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return res.status(200).json({ success: true, data: toBannerDTO(banner) });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    console.error('Update banner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
}

async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    console.error('Delete banner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
}

// Swaps sortOrder with the adjacent banner in the given direction ('up' | 'down')
async function reorderBanner(req, res) {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const all = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Banner not found' });

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= all.length) {
      return res.status(200).json({ success: true, data: all.map(toBannerDTO) });
    }

    const current = all[index];
    const swapWith = all[swapIndex];

    await prisma.$transaction([
      prisma.banner.update({ where: { id: current.id }, data: { sortOrder: swapWith.sortOrder } }),
      prisma.banner.update({ where: { id: swapWith.id }, data: { sortOrder: current.sortOrder } }),
    ]);

    const updated = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    return res.status(200).json({ success: true, data: updated.map(toBannerDTO) });
  } catch (err) {
    console.error('Reorder banner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reorder banner' });
  }
}

module.exports = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanner,
};