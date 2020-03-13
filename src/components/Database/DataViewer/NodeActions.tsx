/**
 * Copyright 2020 Google LLC
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

import * as React from 'react';
import { useState } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { Tooltip } from '@rmwc/tooltip';
import { Icon } from '@rmwc/icon';
import { Menu, MenuItem, MenuSurfaceAnchor } from '@rmwc/menu';
import {
  ChildrenDisplayType,
  QueryParams,
  DEFAULT_QUERY_PARAMS,
} from './common/view_model';
import { EditNode } from './EditNode';
import { InlineQuery } from './InlineQuery';
import { CloneDialog } from './CloneDialog';
import { RenameDialog } from './RenameDialog';

export interface Props {
  realtimeRef: firebase.database.Reference;
  displayType: ChildrenDisplayType;
  queryParams?: QueryParams;
  updateQuery?: (params: QueryParams) => void;
  onDisplayTypeChange: (displayType: ChildrenDisplayType) => void;
  onExpandRequested: () => void;
}

const getNextDisplayType = (current: ChildrenDisplayType) => {
  return current === ChildrenDisplayType.Table
    ? ChildrenDisplayType.TreeView
    : ChildrenDisplayType.Table;
};

const getToggleIcon = (current: ChildrenDisplayType) => {
  switch (current) {
    case ChildrenDisplayType.Table:
      return 'view_comfy';
    case ChildrenDisplayType.TreeView:
      return 'view_list';
    default:
      throw new Error(`Display type is unrecognized`);
  }
};

const ACTIVE_ICON = { color: '#09d3ac' };

export const NodeActions = React.memo<Props>(function NodeActions$({
  displayType,
  onDisplayTypeChange,
  realtimeRef,
  updateQuery,
  onExpandRequested,
  queryParams,
}) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showQueryUi, setShowQueryUi] = useState(false);
  const [cloneDialogIsOpen, setCloneDialogIsOpen] = useState(false);
  const [renameDialogIsOpen, setRenameDialogIsOpen] = useState(false);

  const isActive =
    isMenuOpen ||
    isAdding ||
    showQueryUi ||
    cloneDialogIsOpen ||
    renameDialogIsOpen ||
    queryParams !== DEFAULT_QUERY_PARAMS;
  const isRoot = realtimeRef.parent === null;

  const addChild = () => {
    onExpandRequested();
    setIsAdding(!isAdding);
  };

  const removeNode = async () => {
    try {
      await realtimeRef.remove();
    } catch (e) {
      throw e;
    }
  };

  const showQueryUiAndExpand = () => {
    onExpandRequested();
    setShowQueryUi(true);
  };

  const toggleTable = () => {
    onDisplayTypeChange(getNextDisplayType(displayType));
  };

  return (
    <aside className={'NodeActions' + (isActive ? ' NodeActions--active' : '')}>
      <Tooltip content="Filter children">
        <IconButton
          icon="filter_list"
          onIcon={<span style={ACTIVE_ICON}>filter_list</span>}
          onClick={() => showQueryUiAndExpand()}
          checked={queryParams !== DEFAULT_QUERY_PARAMS}
        />
      </Tooltip>
      <Tooltip content="Add child">
        <IconButton icon="add" onClick={addChild} />
      </Tooltip>
      {!isRoot ? (
        <Tooltip content="Switch view">
          <IconButton
            icon={getToggleIcon(getNextDisplayType(displayType))}
            onClick={() => toggleTable()}
          />
        </Tooltip>
      ) : null}
      <MenuSurfaceAnchor>
        <Menu open={isMenuOpen} onClose={() => setMenuOpen(false)}>
          <MenuItem onClick={removeNode}>
            <Icon icon="delete" /> Remove
          </MenuItem>
          {!isRoot && (
            <MenuItem onClick={() => setCloneDialogIsOpen(true)}>
              <Icon icon="file_copy" /> Clone
            </MenuItem>
          )}
          {!isRoot && (
            <MenuItem onClick={() => setRenameDialogIsOpen(true)}>
              <Icon icon="edit" /> Rename
            </MenuItem>
          )}
        </Menu>
        <IconButton icon="more_vert" onClick={() => setMenuOpen(!isMenuOpen)} />
      </MenuSurfaceAnchor>
      {/* Extra UI that shows when actions are triggered */}
      <div className="NodeActions__additional-ui">
        {isAdding && (
          <EditNode
            realtimeRef={realtimeRef}
            isAdding={isAdding}
            onClose={() => setIsAdding(false)}
          />
        )}
        {showQueryUi && (
          <InlineQuery
            params={queryParams}
            onSubmit={params => {
              updateQuery && updateQuery(params);
              setShowQueryUi(false);
            }}
            onCancel={() => setShowQueryUi(false)}
          />
        )}
        {!isRoot && (
          <CloneDialog
            realtimeRef={realtimeRef}
            isOpen={cloneDialogIsOpen}
            onComplete={() => setCloneDialogIsOpen(false)}
          />
        )}
        {!isRoot && (
          <RenameDialog
            realtimeRef={realtimeRef}
            isOpen={renameDialogIsOpen}
            onComplete={() => setRenameDialogIsOpen(false)}
          />
        )}
      </div>
    </aside>
  );
});