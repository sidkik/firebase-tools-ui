/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { randomId } from '@rmwc/base';
import { Checkbox } from '@rmwc/checkbox';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
} from '@rmwc/data-table';
import React, { KeyboardEvent } from 'react';

import { formatBytes } from '../../../common/formatBytes';
import { Spinner } from '../../../common/Spinner';
import { useStorageFiles } from '../../api/useStorageFiles';
import { StorageFileIcon } from '../../common/StorageFileIcon/StorageFileIcon';
import { StorageFolderIcon } from '../../common/StorageFileIcon/StorageFolderIcon';
import { UseMultiselectResult } from '../../common/useMultiselect';
import { StorageFile, StorageItem } from '../../types';
import styles from './Table.module.scss';
import { ZeroState } from './ZeroState/ZeroState';

interface StorageTableProps {
  selection: UseMultiselectResult;
  selectedFile?: StorageFile;
  selectFile: (file: StorageFile) => void;
}

export const StorageTable: React.FC<StorageTableProps> = ({
  selection,
  selectFile,
  selectedFile,
}) => {
  const { files, bucket, setPath } = useStorageFiles();

  return (
    <div className={styles.tableWrapper}>
      <DataTable className={styles.tableWrapper}>
        <DataTableContent>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell
                hasFormControl
                className={styles.checkboxColumn}
              >
                <Checkbox
                  disabled={files.length === 0}
                  checked={selection.allSelected}
                  indeterminate={selection.allIndeterminate}
                  onChange={() => selection.toggleAll()}
                  aria-label="Select all"
                />
              </DataTableHeadCell>
              <DataTableHeadCell>Name</DataTableHeadCell>
              <DataTableHeadCell>Size</DataTableHeadCell>
              <DataTableHeadCell>Type</DataTableHeadCell>
              <DataTableHeadCell>Last Modified</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          {files.length > 0 ? (
            <DataTableBody>
              {files.map((file) => (
                <StorageFileTableRow
                  selectedFile={selectedFile}
                  bucket={bucket}
                  key={file.fullPath}
                  selection={selection}
                  selectFile={selectFile}
                  item={file}
                  setPath={setPath}
                />
              ))}
            </DataTableBody>
          ) : null}
        </DataTableContent>
      </DataTable>
      {files.length === 0 && <ZeroState />}
    </div>
  );
};

interface StorageTableRowProps {
  item: StorageItem;
  selection: UseMultiselectResult;
  bucket: string;
  selectFile: (file: StorageFile) => void;
  setPath: (path: string) => void;
  selectedFile?: StorageFile;
}

function lastModified(item: StorageItem) {
  if (item.type === 'folder') {
    return <>&mdash;</>;
  }

  // Like in the console, display loading indicator in the last modified column.
  if (item.uploading) {
    return (
      <div className={styles.columnUploading}>
        <Spinner size={20} />
        <span>Uploading...</span>
      </div>
    );
  }

  return new Date(item.updated).toLocaleDateString();
}

export const StorageFileTableRow: React.FC<StorageTableRowProps> = ({
  item,
  selection,
  selectFile,
  setPath,
  selectedFile,
}) => {
  const fileNameId = randomId('file');

  function navigate() {
    if (item.type === 'file') {
      if (selectedFile === item) {
        selectFile(undefined as any);
      } else {
        selectFile(item);
      }
    } else {
      selectFile(undefined as any);
      setPath(item.fullPath);
    }
  }

  return (
    <DataTableRow
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
          navigate();
        }
      }}
      onClick={navigate}
      selected={selectedFile === item}
      className={styles.row}
    >
      <DataTableCell hasFormControl>
        <Checkbox
          aria-labelledby={fileNameId}
          checked={selection.isSelected(item.fullPath)}
          onClick={(event) => {
            event.stopPropagation();
            return selection.toggleSingle(item.fullPath);
          }}
        />
      </DataTableCell>
      <DataTableCell className={styles.name}>
        {item.type === 'folder' ? (
          <>
            <StorageFolderIcon />
            <span className={`${styles.link} ${styles.item} `}>
              {item.name}/
            </span>
          </>
        ) : (
          <>
            <StorageFileIcon contentType={item.contentType} />
            <span id={fileNameId} className={styles.item}>
              {item.name}
            </span>
          </>
        )}
      </DataTableCell>
      <DataTableCell>
        {item.type === 'folder' ? <>&mdash;</> : formatBytes(item.size)}
      </DataTableCell>
      <DataTableCell>
        {item.type === 'folder' ? 'Folder' : item.contentType}
      </DataTableCell>
      <DataTableCell>{lastModified(item)}</DataTableCell>
    </DataTableRow>
  );
};
