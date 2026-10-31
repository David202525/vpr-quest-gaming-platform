import zipfile, sys
P = 'amrp_clothes'
F = {}
F['setup2.xml'] = '''<?xml version="1.0" encoding="UTF-8"?>
<SSetupData>
  <deviceName>dlc_amrp_clothes</deviceName>
  <datFile>content.xml</datFile>
  <timeStamp>10/31/2026 12:00:00</timeStamp>
  <nameHash>amrp_clothes</nameHash>
  <contentChangeSets />
  <contentChangeSetGroups>
    <Item>
      <NameHash>GROUP_STARTUP</NameHash>
      <ContentChangeSets />
    </Item>
  </contentChangeSetGroups>
  <startupScript />
  <scriptCallstackSize value="0" />
  <type>EXTRACONTENT_COMPAT_PACK</type>
  <order value="99" />
  <minorOrder value="0" />
  <isLevelPack value="false" />
  <dependencyPackHash />
  <requiredVersion />
  <subPackCount value="0" />
</SSetupData>
'''
F['content.xml'] = '''<?xml version="1.0" encoding="UTF-8"?>
<CDataFileMgr__ContentsOfDataFileXml>
  <disabledFiles />
  <includedXmlFiles />
  <includedDataFiles />
  <dataFiles>
    <Item>
      <filename>dlc_amrp_clothes:/common/data/mp_m_freemode_01_amrp_clothes.meta</filename>
      <fileType>SHOP_PED_APPAREL_META_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>dlc_amrp_clothes:/common/data/mp_f_freemode_01_amrp_clothes.meta</filename>
      <fileType>SHOP_PED_APPAREL_META_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
    <Item>
      <filename>dlc_amrp_clothes:/%PLATFORM%/models/cdimages/amrp_clothes_male.rpf</filename>
      <fileType>RPF_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="true" />
    </Item>
    <Item>
      <filename>dlc_amrp_clothes:/%PLATFORM%/models/cdimages/amrp_clothes_female.rpf</filename>
      <fileType>RPF_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="true" />
    </Item>
  </dataFiles>
  <contentChangeSets>
    <Item>
      <changeSetName>AMRP_CLOTHES_AUTOGEN</changeSetName>
      <filesToDisable />
      <filesToEnable>
        <Item>dlc_amrp_clothes:/common/data/mp_m_freemode_01_amrp_clothes.meta</Item>
        <Item>dlc_amrp_clothes:/common/data/mp_f_freemode_01_amrp_clothes.meta</Item>
        <Item>dlc_amrp_clothes:/%PLATFORM%/models/cdimages/amrp_clothes_male.rpf</Item>
        <Item>dlc_amrp_clothes:/%PLATFORM%/models/cdimages/amrp_clothes_female.rpf</Item>
      </filesToEnable>
      <txdToLoad />
      <txdToUnload />
      <residentResources />
      <unregisterResources />
    </Item>
  </contentChangeSets>
  <patchFiles />
</CDataFileMgr__ContentsOfDataFileXml>
'''
def meta(s):
    ped = 'mp_%s_freemode_01' % s
    ch = 'SCR_CHAR_MULTIPLAYER' + ('_F' if s == 'f' else '')
    return '''<?xml version="1.0" encoding="UTF-8"?>
<ShopPedApparel>
  <pedName>%s</pedName>
  <dlcName>amrp_clothes</dlcName>
  <fullDlcName>%s_amrp_clothes</fullDlcName>
  <eCharacter>%s</eCharacter>
  <creatureMetaData>%s_amrp_clothes</creatureMetaData>
  <pedOutfits />
  <pedComponents />
  <pedProps />
</ShopPedApparel>
''' % (ped, ped, ch, ped)
F['common/data/mp_m_freemode_01_amrp_clothes.meta'] = meta('m')
F['common/data/mp_f_freemode_01_amrp_clothes.meta'] = meta('f')
NAMES = '''КАК НАЗЫВАТЬ ФАЙЛЫ ВЕЩЕЙ (номера по порядку, с 000, без пропусков)

Деталь           Модель (.ydd)          Цвета (.ytd, a=1-й цвет, b=2-й...)
Верх / худи      jbib_000_u.ydd         jbib_diff_000_a_uni.ytd, jbib_diff_000_b_uni.ytd
Штаны            lowr_000_u.ydd         lowr_diff_000_a_uni.ytd
Обувь            feet_000_u.ydd         feet_diff_000_a_uni.ytd
Маска            berd_000_u.ydd         berd_diff_000_a_uni.ytd
Сумка/рюкзак     hand_000_u.ydd         hand_diff_000_a_uni.ytd
Цепь/аксессуар   teef_000_u.ydd         teef_diff_000_a_uni.ytd
Майка под верх   accs_000_u.ydd         accs_diff_000_a_uni.ytd
Руки (торс)      uppr_000_u.ydd         uppr_diff_000_a_uni.ytd
Шапка            p_head_000.ydd         p_head_diff_000_a.ytd
Очки             p_eyes_000.ydd         p_eyes_diff_000_a.ytd
Часы             p_lwrist_000.ydd       p_lwrist_diff_000_a.ytd

Вторая вещь того же типа — 001, третья — 002 и т.д.
Мужские вещи — в папку male, женские — в female.
'''
F['names.txt'] = NAMES
F['male/README.txt'] = 'Мужские вещи: jbib_000_u.ydd, jbib_diff_000_a_uni.ytd и т.д. Подробно — names.txt\n'
F['female/README.txt'] = 'Женские вещи: jbib_000_u.ydd, jbib_diff_000_a_uni.ytd и т.д. Подробно — names.txt\n'
F['README.txt'] = '''СВОЙ ПАК ОДЕЖДЫ amrp_clothes — БЕЗ ЧУЖИХ ПАКОВ

Это ваш собственный пак одежды. Он ни от кого не зависит: ни от Majestic,
ни от других серверов. Сервер сам читает его, находит каждую вещь, считает
её номер и выставляет в магазин.

ГЛАВНОЕ ПРАВИЛО
В папке dlcpacks не должно быть зашифрованных паков с одеждой.
Если [DLC] в консоли пишет «зашифрован» — такой пак убрать.
Вся одежда сервера — только в открытых паках (этот и другие ваши).

ШАГ 1. ПОДГОТОВЬТЕ ВЕЩИ
Нужны готовые файлы вещи: модель .ydd и текстура .ytd (берутся из открытых
модов, например gta5-mods.com, раздел Player → Clothing, для MP Male/Female).
Назовите их по таблице из names.txt и положите в male/ или female/.

ШАГ 2. СОБЕРИТЕ dlc.rpf (5 минут, бесплатная программа)
Пак одежде нужен служебный файл .ymt — его руками не сделать, его создаёт
программа Durty Cloth Tool (бесплатная, ищется по названию).
  1. Откройте Durty Cloth Tool → New Project.
  2. Add → Male / Female, выберите свои .ydd — текстуры подтянутся сами.
  3. Build → в поле Name впишите amrp_clothes, формат — Singleplayer.
  4. Программа создаст готовый пак (dlc.rpf, шифрование OPEN).
Если вместо dlc.rpf получилась папка — соберите её в OpenIV:
Tools → New → RPF7 Archive «dlc.rpf», Encryption: OPEN, и перенесите внутрь
содержимое папки.
Файлы content.xml, setup2.xml и common/ в этом шаблоне — образец правильной
структуры, по ним можно сверить результат.

ШАГ 3. ПОЛОЖИТЕ НА СЕРВЕР
  client_packages/game_resources/dlcpacks/amrp_clothes/dlc.rpf
Перезапустите сервер. В консоли должно быть:
  [DLC] amrp_clothes: OK — одежда: ♂jbib 1 ♀jbib 1 ...
Игрокам — удалить RAGEMP/client_resources и перезайти.

ШАГ 4. ПРОВЕРКА
Зайдите в игру и наберите /dlcwear — персонаж наденет вещи из вашего пака.
Вещи сами появятся в магазине одежды.

ХУДИ AMRP УЖЕ ВНУТРИ
В папке female лежит ваша женская худи (jbib_000) с 10 цветами — раньше она
была в отдельном паке amrp_merch. После того как соберёте и положите этот пак,
папку dlcpacks/amrp_merch УДАЛИТЕ, иначе худи будет в игре дважды.

ДОБАВИТЬ ВЕЩИ ПОТОМ
Откройте проект в Durty Cloth Tool, добавьте новые .ydd, пересоберите
и замените dlc.rpf. Номера старых вещей не меняются, если добавлять в конец.

ВАЖНО
Шифрование пака — только OPEN. Зашифрованный пак сервер прочитать не сможет,
и номера вещей снова начнут путаться.
'''
out = sys.argv[1]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for k, v in F.items():
        z.writestr(P + '/' + k, v.encode('utf-8'))
import os
kit = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../public/clothes/amrp_merch_kit.zip')
with zipfile.ZipFile(kit) as src, zipfile.ZipFile(out, 'a', zipfile.ZIP_DEFLATED) as z:
    for n in src.namelist():
        if n.startswith('amrp_merch/female/') and not n.endswith('/'):
            z.writestr(P + '/female/' + n.split('/')[-1], src.read(n))
