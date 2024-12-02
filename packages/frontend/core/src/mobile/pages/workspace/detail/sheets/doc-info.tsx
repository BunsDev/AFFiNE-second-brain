import {
  Button,
  Divider,
  Menu,
  PropertyCollapsibleContent,
  PropertyCollapsibleSection,
  Scrollable,
} from '@affine/component';
import {
  type DefaultOpenProperty,
  DocPropertyRow,
} from '@affine/core/components/doc-properties';
import { CreatePropertyMenuItems } from '@affine/core/components/doc-properties/menu/create-doc-property';
import { LinksRow } from '@affine/core/desktop/dialogs/doc-info/links-row';
import { TimeRow } from '@affine/core/desktop/dialogs/doc-info/time-row';
import { DocDatabaseBacklinkInfo } from '@affine/core/modules/doc-info';
import { DocsSearchService } from '@affine/core/modules/docs-search';
import { useI18n } from '@affine/i18n';
import { PlusIcon } from '@blocksuite/icons/rc';
import {
  type DocCustomPropertyInfo,
  DocsService,
  LiveData,
  useLiveData,
  useServices,
} from '@toeverything/infra';
import { Suspense, useCallback, useMemo, useState } from 'react';

import * as styles from './doc-info.css';

export const DocInfoSheet = ({
  docId,
}: {
  docId: string;
  defaultOpenProperty?: DefaultOpenProperty;
}) => {
  const { docsSearchService, docsService } = useServices({
    DocsSearchService,
    DocsService,
  });
  const t = useI18n();

  const links = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsFrom(docId), null),
      [docId, docsSearchService]
    )
  );
  const backlinks = useLiveData(
    useMemo(() => {
      return LiveData.from(docsSearchService.watchRefsTo(docId), []).map(
        links => {
          const visitedDoc = new Set<string>();
          // for each doc, we only show the first block
          return links.filter(link => {
            if (visitedDoc.has(link.docId)) {
              return false;
            }
            visitedDoc.add(link.docId);
            return true;
          });
        }
      );
    }, [docId, docsSearchService])
  );

  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);

  const onPropertyAdded = useCallback((property: DocCustomPropertyInfo) => {
    setNewPropertyId(property.id);
  }, []);

  const properties = useLiveData(docsService.propertyList.sortedProperties$);

  return (
    <Scrollable.Root className={styles.scrollableRoot}>
      <Scrollable.Viewport data-testid="doc-info-menu">
        <Suspense>
          <TimeRow docId={docId} className={styles.timeRow} />
          <Divider size="thinner" />
          {backlinks && backlinks.length > 0 ? (
            <>
              <LinksRow
                className={styles.linksRow}
                references={backlinks}
                label={t['com.affine.page-properties.backlinks']()}
              />
              <Divider size="thinner" />
            </>
          ) : null}
          {links && links.length > 0 ? (
            <>
              <LinksRow
                className={styles.linksRow}
                references={links}
                label={t['com.affine.page-properties.outgoing-links']()}
              />
              <Divider size="thinner" />
            </>
          ) : null}

          <PropertyCollapsibleSection
            title={t.t('com.affine.workspace.properties')}
          >
            <PropertyCollapsibleContent
              className={styles.tableBodyRoot}
              collapseButtonText={({ hide, isCollapsed }) =>
                isCollapsed
                  ? hide === 1
                    ? t['com.affine.page-properties.more-property.one']({
                        count: hide.toString(),
                      })
                    : t['com.affine.page-properties.more-property.more']({
                        count: hide.toString(),
                      })
                  : hide === 1
                    ? t['com.affine.page-properties.hide-property.one']({
                        count: hide.toString(),
                      })
                    : t['com.affine.page-properties.hide-property.more']({
                        count: hide.toString(),
                      })
              }
            >
              {properties.map(property => (
                <DocPropertyRow
                  key={property.id}
                  propertyInfo={property}
                  defaultOpenEditMenu={newPropertyId === property.id}
                />
              ))}
              <Menu
                items={<CreatePropertyMenuItems onCreated={onPropertyAdded} />}
                contentOptions={{
                  onClick(e) {
                    e.stopPropagation();
                  },
                }}
              >
                <Button
                  variant="plain"
                  prefix={<PlusIcon />}
                  className={styles.addPropertyButton}
                >
                  {t['com.affine.page-properties.add-property']()}
                </Button>
              </Menu>
            </PropertyCollapsibleContent>
          </PropertyCollapsibleSection>
          <Divider size="thinner" />

          <DocDatabaseBacklinkInfo />
        </Suspense>
      </Scrollable.Viewport>
      <Scrollable.Scrollbar className={styles.scrollBar} />
    </Scrollable.Root>
  );
};
