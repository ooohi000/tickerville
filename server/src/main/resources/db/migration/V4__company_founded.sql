-- 설립연도 (universe.csv 직접 관리). 시대 테마에서 그 해에 없던 기업을 흐리게 보여준다.
-- 전신이 있으면 전신 기준이고, 그 사정은 founded_note_ko 에 짧게 ("전신 맨해튼 컴퍼니").
alter table company
    add column founded_year    integer check (founded_year between 1600 and 2100),
    add column founded_note_ko varchar(40);
