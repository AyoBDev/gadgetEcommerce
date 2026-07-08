'use client'

import type { LabelFunction, StaticLabel } from 'payload'
import type { ComponentType } from 'react'

import {
  Hamburger,
  Link,
  Logout,
  NavGroup,
  useConfig,
  useNav,
  useTranslation,
} from '@payloadcms/ui'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Dashboard from '@mui/icons-material/Dashboard'
import Inventory2 from '@mui/icons-material/Inventory2'
import PointOfSale from '@mui/icons-material/PointOfSale'
import Storefront from '@mui/icons-material/Storefront'

import './Nav.module.scss'

const baseClass = 'nav'

const UNGROUPED = 'General'

type EntityLabel = LabelFunction | StaticLabel

// Resolve a Payload label (string | localized record | function) to a string,
// mirroring what `getTranslation` does, without pulling in an extra dependency.
const resolveLabel = (label: EntityLabel | undefined, i18n: { language: string }): string => {
  if (!label) {
    return ''
  }
  if (typeof label === 'string') {
    return label
  }
  if (typeof label === 'function') {
    return label({ i18n: i18n as never, t: ((key: string) => key) as never })
  }
  return label[i18n.language] ?? label.en ?? Object.values(label)[0] ?? ''
}

// Map a group label to its MUI icon; generic ChevronRight fallback.
const groupIcons: Record<string, ComponentType<{ fontSize?: 'small' | 'inherit' }>> = {
  Catalog: Inventory2,
  Sales: PointOfSale,
  Store: Storefront,
  Admin: AdminPanelSettings,
}

type NavEntry = {
  href: string
  id: string
  label: EntityLabel
}

type NavSection = {
  entries: NavEntry[]
  label: string
}

const NavLink: React.FC<{ entry: NavEntry; ItemIcon: ComponentType<{ fontSize?: 'small' | 'inherit' }> }> = ({
  entry,
  ItemIcon,
}) => {
  const pathname = usePathname()
  const { i18n } = useTranslation()

  // Mirror Payload's active-link detection from DefaultNavClient.
  const isActive =
    pathname.startsWith(entry.href) && ['/', undefined].includes(pathname[entry.href.length])

  const label = (
    <React.Fragment>
      {isActive && <div className={`${baseClass}__link-indicator`} />}
      <ItemIcon fontSize="small" />
      <span className={`${baseClass}__link-label`}>{resolveLabel(entry.label, i18n)}</span>
    </React.Fragment>
  )

  if (pathname === entry.href) {
    return (
      <div className={`${baseClass}__link`} id={entry.id}>
        {label}
      </div>
    )
  }

  return (
    <Link className={`${baseClass}__link`} href={entry.href} id={entry.id} prefetch={false}>
      {label}
    </Link>
  )
}

const CustomNav: React.FC = () => {
  const { config } = useConfig()
  const pathname = usePathname()
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav()

  const {
    admin: {
      routes: { account: accountRoute },
    },
    collections,
    globals,
    routes: { admin: adminRoute },
  } = config

  // Build grouped sections directly from the client config's admin.group.
  const sectionsByLabel = new Map<string, NavSection>()

  const pushEntry = (groupLabel: string | undefined, entry: NavEntry) => {
    const key = groupLabel && groupLabel.length > 0 ? groupLabel : UNGROUPED
    const existing = sectionsByLabel.get(key)
    if (existing) {
      existing.entries.push(entry)
    } else {
      sectionsByLabel.set(key, { entries: [entry], label: key })
    }
  }

  // The client config already excludes hidden entities, so no filtering needed.
  for (const collection of collections) {
    pushEntry(collection.admin?.group as string | undefined, {
      href: formatAdminURL({ adminRoute, path: `/collections/${collection.slug}` }),
      id: `nav-${collection.slug}`,
      label: collection.labels?.plural ?? collection.slug,
    })
  }

  for (const global of globals) {
    pushEntry(global.admin?.group as string | undefined, {
      href: formatAdminURL({ adminRoute, path: `/globals/${global.slug}` }),
      id: `nav-global-${global.slug}`,
      label: global.label ?? global.slug,
    })
  }

  const sections = Array.from(sectionsByLabel.values())

  const dashboardHref = formatAdminURL({ adminRoute, path: '' }) || adminRoute
  const dashboardActive = pathname === dashboardHref || pathname === adminRoute

  const wrapperClasses = [
    baseClass,
    navOpen && `${baseClass}--nav-open`,
    shouldAnimate && `${baseClass}--nav-animate`,
    hydrated && `${baseClass}--nav-hydrated`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <React.Fragment>
      <aside className={wrapperClasses} inert={!navOpen ? true : undefined}>
        <div className={`${baseClass}__scroll`} ref={navRef}>
          <nav className={`${baseClass}__wrap`}>
            {/* Top-level Dashboard link */}
            <Link
              className={`${baseClass}__link`}
              href={dashboardHref}
              id="nav-dashboard"
              prefetch={false}
            >
              {dashboardActive && <div className={`${baseClass}__link-indicator`} />}
              <Dashboard fontSize="small" />
              <span className={`${baseClass}__link-label`}>Dashboard</span>
            </Link>

            {sections.map((section) => {
              const ItemIcon = groupIcons[section.label] ?? ChevronRight
              return (
                <NavGroup key={section.label} label={section.label}>
                  {section.entries.map((entry) => (
                    <NavLink entry={entry} ItemIcon={ItemIcon} key={entry.id} />
                  ))}
                </NavGroup>
              )
            })}

            <div className={`${baseClass}__controls`}>
              <Link
                className={`${baseClass}__link`}
                href={formatAdminURL({ adminRoute, path: accountRoute })}
                id="nav-account"
                prefetch={false}
              >
                <span className={`${baseClass}__link-label`}>Account</span>
              </Link>
              <Logout />
            </div>
          </nav>
        </div>
      </aside>

      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <button
            className={`${baseClass}__mobile-close`}
            onClick={() => setNavOpen(false)}
            tabIndex={!navOpen ? -1 : undefined}
            type="button"
          >
            <Hamburger isActive />
          </button>
        </div>
      </div>
    </React.Fragment>
  )
}

export default CustomNav
